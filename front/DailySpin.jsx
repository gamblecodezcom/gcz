// frontend/src/pages/DailySpin.jsx
import React, { useState, useEffect } from "react";
import DegenWheel from "../components/DegenWheel";
import { getDailySpinEligibility, spinDaily } from "../utils/api";

const DailySpin = () => {
  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDailySpinEligibility("demo-user")
      .then((res) => {
        if (res.eligible) setStatus("ready");
        else {
          setStatus("cooldown");
          setResult({ reward: null, nextSpin: res.nextSpin });
        }
      })
      .catch((e) => {
        setError("Eligibility check failed.");
        setStatus("error");
      });
  }, []);

  const handleSpin = () => {
    setStatus("spinning");
    spinDaily("demo-user")
      .then((res) => {
        setResult({ reward: res.reward });
        setStatus("done");
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Spin failed.");
        setStatus("error");
      });
  };

  return (
    <div className="flex flex-col items-center p-4 text-center">
      <h2 className="text-3xl mb-4">Degen Daily Spin</h2>
      <DegenWheel reward={result?.reward} spinning={status === "spinning"} />
      {status === "ready" && (
        <button onClick={handleSpin} className="neon-button mt-6">
          Spin Now
        </button>
      )}
      {status === "cooldown" && (
        <p className="mt-4 text-yellow-400">
          Next spin available: {new Date(result.nextSpin).toLocaleString()}
        </p>
      )}
      {status === "done" && result.reward && (
        <p className="mt-4 text-green-400">You won: {result.reward}</p>
      )}
      {status === "error" && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default DailySpin;