import React from 'react';

interface CourseProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}

export const CourseProgressRing: React.FC<CourseProgressRingProps> = ({
  completed,
  total,
  size = 52,
  strokeWidth = 4,
  color = '#D4AF6E',
  bgColor = 'rgba(212,175,110,0.12)',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total === 0 ? 0 : Math.min(completed / total, 1);
  const offset = circumference - pct * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={pct === 1 ? '#34d399' : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        {pct === 1 ? (
          <span className="text-emerald-400 text-base font-bold">✓</span>
        ) : (
          <span className="text-[11px] font-bold font-mono" style={{ color: pct === 0 ? '#8E8B82' : color }}>
            {Math.round(pct * 100)}%
          </span>
        )}
      </div>
    </div>
  );
};
