import React, { useState, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { SpinnerIcon } from '../icons/Icons';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;
  const maxPull = 120;

  const bind = useDrag(
    async ({ movement: [, my], last, velocity: [, vy], memo = window.scrollY }) => {
      // Only allow pull-to-refresh when at the top of the page
      if (memo > 0) return memo;

      // Only pull down
      if (my < 0) {
        setPullDistance(0);
        return memo;
      }

      // Limit pull distance
      const distance = Math.min(my, maxPull);
      setPullDistance(distance);

      // Trigger refresh on release
      if (last && distance > threshold && vy > 0 && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else if (last) {
        setPullDistance(0);
      }

      return memo;
    },
    {
      axis: 'y',
      filterTaps: true,
      from: () => [0, window.scrollY],
    }
  );

  const opacity = Math.min(pullDistance / threshold, 1);
  const rotation = (pullDistance / threshold) * 360;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity"
        style={{
          height: `${pullDistance}px`,
          opacity: opacity,
        }}
      >
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
          {isRefreshing ? (
            <SpinnerIcon className="w-6 h-6 text-blue-400 animate-spin" />
          ) : (
            <svg
              className="w-6 h-6 text-blue-400 transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        {...bind()}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
        className="touch-pan-x"
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
