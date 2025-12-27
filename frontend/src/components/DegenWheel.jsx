import React, { useState, useRef } from "react";
import "./DegenWheel.css";

const SEGMENTS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "JACKPOT", value: "JACKPOT" }
];

export default function DegenWheel() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const wheelRef = useRef(null);

  const spin = async () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    // Call backend for reward
    const res = await fetch("/api/daily/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    const reward = data.reward;

    // Find segment index
    const index = SEGMENTS.findIndex((s) => s.value === reward);

    // Calculate rotation
    const segmentAngle = 360 / SEGMENTS.length;
    const randomExtra = Math.floor(Math.random() * 360);
    const finalRotation =
      360 * 8 + (360 - index * segmentAngle) + randomExtra;

    wheelRef.current.style.transition = "transform 4s cubic-bezier(0.1, 0.8, 0.2, 1)";
    wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;

    setTimeout(() => {
      setSpinning(false);
      setResult(reward);
    }, 4200);
  };

  return (
    <div className="wheel-container">
      <p className="wheel-tagline">
        Always rewarding, and built for degen dopamine without breaking fairness.
      </p>

      <div className="wheel-wrapper">
        <div className="wheel" ref={wheelRef}>
          {SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className={`segment ${seg.value === "JACKPOT" ? "jackpot" : ""}`}
              style={{
                transform: `rotate(${(360 / SEGMENTS.length) * i}deg)`
              }}
            >
              <span>{seg.label}</span>
            </div>
          ))}
        </div>

        <div className="crown">
          👑
        </div>
      </div>

      <button
        className={`spin-btn ${spinning ? "disabled" : ""}`}
        onClick={spin}
      >
        {spinning ? "SPINNING..." : "SPIN NOW"}
      </button>

      {result && (
        <div className="result-popup">
          <div className="result-box">
            {result === "JACKPOT" ? (
              <>
                <h2 className="jackpot-text">DEGEN JACKPOT!</h2>
                <p>You won the ultra‑rare jackpot!</p>
              </>
            ) : (
              <>
                <h2 className="reward-text">+{result} Entries</h2>
                <p>Nice pull, degen.</p>
              </>
            )}
            <button onClick={() => setResult(null)} className="close-btn">
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}