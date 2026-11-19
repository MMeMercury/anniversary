import { useEffect, useState } from 'react';
import './FlipDigit.scss';

export default function FlipDigit({ digit }) {
  const [previous, setPrevious] = useState(digit);
  const flipping = previous !== digit;
  useEffect(() => {
    if (previous === digit) return undefined;
    const timer = setTimeout(() => setPrevious(digit), 480);
    return () => clearTimeout(timer);
  }, [digit, previous]);
  return (
    <div className={`flip-digit${flipping ? ' is-flipping' : ''}`}>
      <div className="digit-upper"><span>{digit}</span></div>
      <div className="digit-lower"><span>{flipping ? previous : digit}</span></div>
      {flipping && <><div className="digit-flap digit-flap-top"><span>{previous}</span></div><div className="digit-flap digit-flap-bottom"><span>{digit}</span></div></>}
      <i className="digit-hinge" />
    </div>
  );
}
