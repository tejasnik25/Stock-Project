'use client';

import React, { useEffect, useState } from 'react';

type MathCaptchaProps = {
  onSolvedChange?: (solved: boolean) => void;
  className?: string;
};

const MathCaptcha: React.FC<MathCaptchaProps> = ({ onSolvedChange, className }) => {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onSolvedChange) onSolvedChange(isSolved);
  }, [isSolved, onSolvedChange]);

  const reset = () => {
    const na = Math.floor(Math.random() * 8) + 1; // 1..8
    const nb = Math.floor(Math.random() * 8) + 1; // 1..8
    setA(na);
    setB(nb);
    setAnswer('');
    setIsSolved(false);
  };

  const validate = (value: string) => {
    setAnswer(value);
    const num = Number(value);
    if (!Number.isNaN(num) && num === a + b) setIsSolved(true);
    else setIsSolved(false);
  };

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-300">Prove you're human</label>
      <div className="mt-2 flex gap-2 items-center">
        <span className="bg-white/5 border border-white/10 rounded px-3 py-2 text-gray-100">{a} + {b} =</span>
        <input
          type="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => validate(e.target.value)}
          className="px-3 py-2 rounded bg-transparent border border-white/10 text-white w-28"
          aria-label="captcha-answer"
        />
        <button type="button" onClick={reset} className="text-xs text-blue-400 hover:text-blue-300">Reset</button>
      </div>
      {isSolved ? (
        <p className="text-xs text-green-400 mt-2">Captcha solved</p>
      ) : (
        <p className="text-xs text-gray-400 mt-2">Please solve the math to continue.</p>
      )}
    </div>
  );
};

export default MathCaptcha;
