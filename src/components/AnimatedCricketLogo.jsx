import React, { useEffect, useRef } from 'react';

export default function CleanCricketLogo() {
  const ballRef = useRef(null);
  const batRef = useRef(null);
  const stumpsRef = useRef(null);

  useEffect(() => {
    // Ball animation
    const ball = ballRef.current;
    if (ball) {
      ball.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-8px)' },
          { transform: 'translateX(0)' },
        ],
        {
          duration: 3000,
          iterations: Infinity,
          easing: 'ease-in-out'
        }
      );
    }

    // Bat animation
    const bat = batRef.current;
    if (bat) {
      bat.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-10deg)' },
          { transform: 'rotate(0deg)' },
        ],
        {
          duration: 3000,
          iterations: Infinity,
          easing: 'ease-in-out'
        }
      );
    }

    // Stumps subtle pulse
    const stumps = stumpsRef.current;
    if (stumps) {
      stumps.animate(
        [
          { filter: 'drop-shadow(0 0 1px #ffffff)' },
          { filter: 'drop-shadow(0 0 3px #ffffff)' },
          { filter: 'drop-shadow(0 0 1px #ffffff)' },
        ],
        {
          duration: 2500,
          iterations: Infinity,
          easing: 'ease-in-out'
        }
      );
    }
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-64 h-64">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#4ade80" strokeWidth="2" />
          
          {/* Cricket stumps */}
          <g ref={stumpsRef}>
            <line x1="45" y1="30" x2="45" y2="70" stroke="#f8fafc" strokeWidth="2" />
            <line x1="50" y1="30" x2="50" y2="70" stroke="#f8fafc" strokeWidth="2" />
            <line x1="55" y1="30" x2="55" y2="70" stroke="#f8fafc" strokeWidth="2" />
            <line x1="40" y1="30" x2="60" y2="30" stroke="#f8fafc" strokeWidth="2" />
            <line x1="40" y1="70" x2="60" y2="70" stroke="#f8fafc" strokeWidth="2" />
          </g>
          
          {/* Cricket bat */}
          <g ref={batRef} transform="rotate(-10, 65, 60)">
            <path d="M65 50 L75 35 L80 38 L70 55 Z" fill="#ca8a04" />
            <rect x="68" y="54" width="3" height="18" fill="#854d0e" />
          </g>
          
          {/* Cricket ball */}
          <circle ref={ballRef} cx="30" cy="50" r="7" fill="#ef4444" />
          <path d="M28 46 Q30 50 28 54" stroke="#f8fafc" strokeWidth="0.75" fill="none" />
          <path d="M32 46 Q30 50 32 54" stroke="#f8fafc" strokeWidth="0.75" fill="none" />
        </svg>
      </div>
    </div>
  );
}