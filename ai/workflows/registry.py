from ai.workflows.tasks import (
    workflow_ai_generate,
    workflow_echo,
    workflow_health_scan,
    workflow_memory_add,
)

WORKFLOW_REGISTRY = {
    "health_scan": workflow_health_scan,
    "memory_add": workflow_memory_add,
    "ai_generate": workflow_ai_generate,
    "echo": workflow_echo,
}
