// src/pages/HomePage.jsx
import React ,{useState,useEffect,useRef}from 'react';
import Typewriter from 'typewriter-effect';
import {FaHeart} from 'react-icons/fa';
import confetti from 'canvas-confetti';
import './HomePage.scss';
import Particles from 'react-tsparticles';
import Countdown from '../components/Countdown';


function pad2(n) {
  return n.toString().padStart(2, '0');
}

const useFlipNumber = (getValue) => {
  const [cur, setCur] = useState(getValue());
  const [next, setNext] = useState(getValue());
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    let timer;
    function checkAndFlip() {
      const value = getValue();
      if ((!flipping) && (pad2(value) !== pad2(cur))) {
        setNext(value);
        setFlipping(true);
        setTimeout(() => {
          setCur(getValue()); // 动画结束后用最新值，防止漏翻
          setFlipping(false);
        }, 400);
      }
      timer = setTimeout(checkAndFlip, 100); // 检查频率高一点，动画期间不会重复触发
    }
    checkAndFlip();
    return () => clearTimeout(timer);
  }, [getValue, cur, flipping]);

  return { cur: pad2(cur), next: pad2(next), flipping };
};

<Particles
  options={{
    background: { color: 'transparent' },
    particles: {
      number: { value: 20 },
      shape: {
        type: 'image',
        image: {
          src: '/heart.png', // 你准备的爱心图
          width: 20,
          height: 20,
        }
      },
      move: {
        speed: 1,
        direction: 'bottom',
        outModes: { default: 'out' },
      },
    }
  }}
/>

const getTimeSince = () => {
  const start = new Date('2025-03-15T18:00:00');
  const now = new Date();
  let diff = Math.max(0, now - start);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  const seconds = Math.floor(diff / 1000);

  return `${days}天${hours}小时${minutes}分${seconds}秒`; // 返回对象
};

const time=getTimeSince();

const messages = [
  'Floyd, 你好哇！',
  '欢迎来到我们的网站',
  '距离我们开启确定的关系，和漫不经心打打闹闹的日子已经',
  `${time}了`,
];

function launchConfetti() {
  confetti({
    particleCount: 200,
    spread: 90,
    origin: { y: 0.6 },
    colors: ['#ff6ec4', '#7873f5', '#fddb92'],
    shapes: ['circle'],
  });
};



const HomePage = () => {
  const containerRef = useRef(null);
  const textContainerRef = useRef(null);

  const [step, setStep] = useState(0);            // 当前第几句话
  const [doneTyping, setDoneTyping] = useState(false); // 是否打完当前句

  const handleNext = () => {
    if (step < messages.length - 1) {
      setStep(step + 1);
      // setDoneTyping(false); // 准备下一句话
    }
  };

  const addFallingSparkle = () => {
    const sparkle = document.createElement('span');
    sparkle.className = 'falling-sparkle';
    sparkle.innerText = Math.random() > 0.5 ? '✨' : '💗';
  
    const container = textContainerRef.current;
    const offset = Math.random() * 100 - 50;
    sparkle.style.left = `${50 + offset}%`;
  
    container?.appendChild(sparkle);
  };
  
  
  
  useEffect(() => {
    if (doneTyping && step === messages.length - 1 && containerRef.current) {
      launchConfetti();
    }
  }, [doneTyping, step]);

  

  // 假设 timeParts.days、hours、minutes、seconds 都是数字
  const { cur: hourCur, next: hourNext, flipping: hourFlip } = useFlipNumber(() => new Date().getHours());
  const { cur: minCur, next: minNext, flipping: minFlip } = useFlipNumber(() => new Date().getMinutes());
  const { cur: secCur, next: secNext, flipping: secFlip } = useFlipNumber(() => new Date().getSeconds());
  
  // if (flipping) return;
  
  return (
    
    <div className="homepage"  ref={containerRef}>
      {/* 你的其他内容 */}
      <header className="intro" ref={textContainerRef}>
        <div className="typewriter-text">
          <Typewriter
            key={step} 
            onInit={(typewriter) => {
                const chars = messages[step].split('');
                chars.forEach((ch, i) => {
                  typewriter
                    .typeString(ch)
                    .callFunction(() => {
                      addFallingSparkle();
                    });
                });

              typewriter
                // .typeString(messages[step])
                .callFunction(() => {
                  setDoneTyping(true); // 当前句打完
                  if(step < messages.length - 1) {
                    setTimeout(() => {
                      handleNext(); // 自动切换到下一句
                    }, 2000); // 等待2秒后自动切换
                  }
                })
                 .start();
            }}
            options={{
              autoStart: true,
              loop: false,
              delay: 50,
              cursor:'',       
              pauseFor:50     
            }}
            
          />
          
        </div>

        

        {doneTyping && step === messages.length - 1 && (
          <button className="next-btn" 
          onClick={handleNext}><FaHeart style={{ marginRight: '0.5rem' }} />
        点击继续
        </button>
          
          )}

        
      </header>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
    <div className={`card-container${hourFlip ? ' flip' : ''}`} id="card-h" key={hourFlip ? 'flip' : 'noflip'}>
      <div className="card1 card-item">{hourFlip ? hourNext : hourCur}</div>
      <div className="card2 card-item">{hourFlip ? hourNext : hourCur}</div>
      <div className="card3 card-item">{hourCur}</div>
      <div className="card4 card-item">{hourCur}</div>
      <div className="card-label">时</div>
    </div>
    <div className={`card-container${minFlip ? ' flip' : ''}`} id="card-m" key={hourFlip ? 'flip' : 'noflip'}>
      <div className="card1 card-item">{minFlip ? minNext : minCur}</div>
      <div className="card2 card-item">{minFlip ? minNext : minCur}</div>
      <div className="card3 card-item">{minCur}</div>
      <div className="card4 card-item">{minCur}</div>
      <div className="card-label">分</div>
    </div>
    <div className={`card-container${secFlip ? ' flip' : ''}`} id="card-s" key={hourFlip ? 'flip' : 'noflip'}>
      <div className="card1 card-item">{secNext}</div>
      <div className="card2 card-item">{secNext }</div>
      <div className="card3 card-item">{secCur}</div>
      <div className="card4 card-item">{secCur}</div>
      <div className="card-label">秒</div>
    </div>
  </div>
    </div>
  );
};

export default HomePage;
