import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on fine pointer (desktop mouse), not on touch screens
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const clickable = target.closest('button, a, input, select, textarea, [role="button"], [data-cursor-hover]');
        setIsHovered(!!clickable);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out hidden md:block"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        left: 0,
        top: 0,
      }}
    >
      {/* Precision Reticle Center */}
      <div
        className={`relative -left-1/2 -top-1/2 flex items-center justify-center transition-all duration-200 ${
          isHovered ? 'scale-150' : 'scale-100'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
        
        {/* Technical Target Circle */}
        <div
          className={`absolute rounded-full border transition-all duration-300 ${
            isHovered
              ? 'w-9 h-9 border-cyan-400/80 bg-cyan-400/10'
              : 'w-6 h-6 border-white/20'
          }`}
        />
        
        {/* CAD Crosshair ticks */}
        {isHovered && (
          <>
            <span className="absolute -top-3 w-[1px] h-2 bg-cyan-400/80" />
            <span className="absolute -bottom-3 w-[1px] h-2 bg-cyan-400/80" />
            <span className="absolute -left-3 h-[1px] w-2 bg-cyan-400/80" />
            <span className="absolute -right-3 h-[1px] w-2 bg-cyan-400/80" />
          </>
        )}
      </div>
    </div>
  );
};
