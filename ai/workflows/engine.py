from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from ai.ai_logger import get_logger, set_trace_id
from ai.db import DB
from ai.tools.ai_clients import AIClient
from ai.workflows.registry import WORKFLOW_REGISTRY

logger = get_logger("gcz-ai.workflow-engine")


@dataclass
class JobResult:
    success: bool
    output: Dict[str, Any]
    error: Optional[str] = None


class WorkflowEngine:
    def __init__(self, ai_client: AIClient) -> None:
        self._ai_client = ai_client
        self._worker_task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

    async def ensure_tables(self) -> None:
        await DB.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_memory (
                id SERIAL PRIMARY KEY,
                category TEXT,
                message TEXT,
                source TEXT,
                meta JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """
        )
        await DB.execute(
            """
            CREATE TABLE IF NOT EXISTS service_health (
                id SERIAL PRIMARY KEY,
                service TEXT,
                status TEXT,
                details JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """
        )
        await DB.execute(
            """
            CREATE TABLE IF NOT EXISTS anomalies (
                id SERIAL PRIMARY KEY,
                type TEXT,
                message TEXT,
                meta JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
            """
        )
        await DB.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_jobs (
                id UUID PRIMARY KEY,
                job_type TEXT NOT NULL,
                payload JSONB NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                attempts INT NOT NULL DEFAULT 0,
                max_attempts INT NOT NULL DEFAULT 3,
                run_at TIMESTAMP NOT NULL DEFAULT NOW(),
                last_error TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
            """
        )
        await DB.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_dead_letters (
                id UUID PRIMARY KEY,
                job_type TEXT NOT NULL,
                payload JSONB NOT NULL,
                error TEXT,
                attempts INT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                failed_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
            """
        )

    async def start(self) -> None:
        if self._worker_task and not self._worker_task.done():
            return
        self._stop_event.clear()
        self._worker_task = asyncio.create_task(self._worker_loop(), name="gcz-ai-worker")
        logger.info("Workflow engine started")

    async def stop(self) -> None:
        self._stop_event.set()
        if self._worker_task:
            await self._worker_task
        logger.info("Workflow engine stopped")

    async def enqueue_job(
        self,
        job_type: str,
        payload: Dict[str, Any],
        max_attempts: int = 3,
    ) -> str:
        job_id = str(uuid4())
        await DB.execute(
            """
            INSERT INTO ai_jobs (id, job_type, payload, max_attempts)
            VALUES ($1, $2, $3::jsonb, $4)
            """,
            (job_id, job_type, payload, max_attempts),
        )
        return job_id

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return await DB.fetchrow(
            "SELECT * FROM ai_jobs WHERE id = $1",
            (job_id,),
        )

    async def _worker_loop(self) -> None:
        while not self._stop_event.is_set():
            job = await self._claim_next_job()
            if not job:
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                continue

            trace_id = job.get("id", str(uuid4()))
            set_trace_id(trace_id)
            result = await self._run_job(job)
            await self._finalize_job(job, result)

    async def _claim_next_job(self) -> Optional[Dict[str, Any]]:
        return await DB.fetchrow(
            """
            UPDATE ai_jobs
            SET status = 'running',
                attempts = attempts + 1,
                updated_at = NOW()
            WHERE id = (
                SELECT id FROM ai_jobs
                WHERE status = 'queued'
                  AND run_at <= NOW()
                ORDER BY created_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 1
            )
            RETURNING *;
            """
        )

    async def _run_job(self, job: Dict[str, Any]) -> JobResult:
        job_type = job.get("job_type")
        handler = WORKFLOW_REGISTRY.get(job_type)
        if not handler:
            return JobResult(False, {}, error=f"Unknown job_type: {job_type}")

        try:
            output = await handler(job.get("payload", {}), self._ai_client)
            return JobResult(True, output)
        except Exception as exc:
            logger.error("Job execution failed", extra={"job_id": job.get("id"), "error": str(exc)})
            return JobResult(False, {}, error=str(exc))

    async def _finalize_job(self, job: Dict[str, Any], result: JobResult) -> None:
        job_id = job.get("id")
        attempts = job.get("attempts", 0)
        max_attempts = job.get("max_attempts", 3)

        if result.success:
            await DB.execute(
                """
                UPDATE ai_jobs
                SET status = 'succeeded',
                    updated_at = NOW(),
                    last_error = NULL
                WHERE id = $1
                """,
                (job_id,),
            )
            return

        if attempts >= max_attempts:
            await DB.execute(
                """
                INSERT INTO ai_dead_letters (id, job_type, payload, error, attempts)
                VALUES ($1, $2, $3::jsonb, $4, $5)
                """,
                (job_id, job.get("job_type"), job.get("payload", {}), result.error, attempts),
            )
            await DB.execute("DELETE FROM ai_jobs WHERE id = $1", (job_id,))
            logger.error("Job moved to dead letter queue", extra={"job_id": job_id})
            return

        await DB.execute(
            """
            UPDATE ai_jobs
            SET status = 'queued',
                updated_at = NOW(),
                last_error = $2,
                run_at = NOW() + INTERVAL '5 seconds'
            WHERE id = $1
            """,
            (job_id, result.error or "unknown error"),
        )
        logger.warning("Job re-queued after failure", extra={"job_id": job_id})


__all__ = ["WorkflowEngine"]
