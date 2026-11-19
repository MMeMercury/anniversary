import { useEffect, useState } from 'react';

export default function TypewriterText({ text, paused }) {
  const [length, setLength] = useState(0);
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    setLength(0);
    if (reduced || paused) return undefined;
    const timer = setInterval(() => setLength(value => {
      if (value >= text.length) clearInterval(timer);
      return Math.min(value + 1, text.length);
    }), 45);
    return () => clearInterval(timer);
  }, [text, reduced, paused]);
  if (reduced || paused) return <span>{text}</span>;
  return <><span className="sr-only">{text}</span><span aria-hidden="true">{text.slice(0, length)}<span className="typing-cursor">|</span></span></>;
}
