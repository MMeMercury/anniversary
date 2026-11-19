import FlipDigit from './FlipDigit';

export default function Countdown({ parts }) {
  const values = [parts.days, parts.hours, parts.minutes, parts.seconds];
  return (
    <div className="flip-clock" role="timer" aria-live="off" aria-label={`${parts.days}天 ${parts.hours}小时 ${parts.minutes}分钟 ${parts.seconds}秒`}>
      {['天', '小时', '分钟', '秒'].map((label, index) => (
        <div className="clock-group" key={label} aria-hidden="true">
          <div className="clock-digits">
            {String(values[index]).padStart(2, '0').split('').map((digit, place) => <FlipDigit key={place} digit={digit} />)}
          </div>
          <span className="clock-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
