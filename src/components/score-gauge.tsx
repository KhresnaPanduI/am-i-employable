"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

type ScoreGaugeProps = {
  score: number;
  label: string;
  caption: string;
};

function getTone(score: number) {
  if (score >= 80) {
    return "strong";
  }

  if (score >= 60) {
    return "mid";
  }

  if (score >= 40) {
    return "warn";
  }

  return "critical";
}

export function ScoreGauge({ score, label, caption }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayScore(Math.round(score * progress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [score]);

  const tone = getTone(score);

  return (
    <div className={clsx("score-gauge", `score-gauge--${tone}`)}>
      <span className="score-label">{label}</span>
      <div className="score-value">
        {displayScore}
        <span>%</span>
      </div>
      <p className="score-caption">{caption}</p>
    </div>
  );
}
