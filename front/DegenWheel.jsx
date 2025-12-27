// frontend/src/components/DegenWheel.jsx
import React from "react";
import "./DegenWheel.css";

const DegenWheel = ({ reward, spinning }) => {
  return (
    <div className="wheel-container">
      <div className={`wheel ${spinning ? "spin" : ""}`}></div>
      {reward && <div className="reward-text">🎉 {reward} 🎉</div>}
    </div>
  );
};

export default DegenWheel;