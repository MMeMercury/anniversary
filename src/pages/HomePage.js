// src/pages/HomePage.jsx
import React ,{useState,useEffect,useRef}from 'react';
import Typewriter from 'typewriter-effect';
import {FaHeart} from 'react-icons/fa';
import confetti from 'canvas-confetti';
import './HomePage.scss';
import Particles from 'react-tsparticles';

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


const messages = [
  'Floyd, 你好哇！',
  '欢迎来到我们的网站',
  '距离我们开启确定的关系，和漫不经心打打闹闹的日子已经',
  '100天了！',
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
    const offset = Math.random() * 80 - 40;
    sparkle.style.left = `${50 + offset}%`;
  
    container?.appendChild(sparkle);
  };
  
  
  
  useEffect(() => {
    if (doneTyping && step === messages.length - 1 && containerRef.current) {
      launchConfetti();
    }
  }, [doneTyping, step]);

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
      {/* ... */}
    </div>
  );
};

export default HomePage;
