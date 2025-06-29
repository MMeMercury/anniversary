// src/components/FlipDigit.jsx
import React, { useEffect, useState } from 'react';
import './FlipDigit.scss';

const FlipDigit = ({ digit }) => {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setFlipping(true);
      const timeout = setTimeout(() => {
        setFlipping(false);
        setPrevDigit(digit);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [digit, prevDigit]);

  return (
    <div className="flip-digit">
      <div className="upper">{flipping ? prevDigit : digit}</div>
      <div className="lower">{digit}</div>
      <div className={`flip ${flipping ? 'animate' : ''}`}>
        <div className="flip-top">{prevDigit}</div>
        <div className="flip-bottom">{digit}</div>
      </div>
    </div>
  );
};

export default FlipDigit;
