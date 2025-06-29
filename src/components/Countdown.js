// src/components/Countdown.jsx
import React, { useEffect, useState } from 'react';
import FlipDigit from './FlipDigit';

const Countdown = ({ targetDate }) => {

  function getTimeRemaining() {
    const now = new Date();
    const end = new Date(targetDate);
    const diff = now - end;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
  }
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDigits = (n) => String(n).padStart(2, '0').split('');

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      {['天', '时', '分', '秒'].map((label, i) => {
        const value = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds][i];
        const digits = formatDigits(value);
        return (
          <div key={label}>
            <div style={{ display: 'flex' }}>
              {digits.map((d, idx) => (
                <FlipDigit key={idx} digit={d} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '5px', color: '#666' }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default Countdown;
