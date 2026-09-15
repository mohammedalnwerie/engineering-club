import React from 'react';

interface ClubLogoProps {
  variant?: 'full' | 'emblem' | 'horizontal' | 'icon';
  theme?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const ClubLogo: React.FC<ClubLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeMap = {
    sm: { img: 'h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { img: 'h-10 sm:h-11', text: 'text-base sm:text-lg', sub: 'text-[10px]' },
    lg: { img: 'h-14 sm:h-16', text: 'text-xl sm:text-2xl', sub: 'text-xs' },
    xl: { img: 'h-20 sm:h-24', text: 'text-2xl sm:text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <img
          src={theme === 'dark' ? '/brand/logo-dark-card.png' : '/brand/logo-main.png'}
          alt="النادي الهندسي - جامعة فلسطين"
          className="max-h-36 w-auto object-contain drop-shadow-md"
        />
      </div>
    );
  }

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={theme === 'dark' ? '/brand/app-icon.png' : '/brand/emblem-main.png'}
          alt="شعار النادي الهندسي UP"
          className={`${currentSize.img} w-auto object-contain rounded-xl`}
        />
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-md border border-white/10 ${className}`}>
        <img
          src="/brand/app-icon.png"
          alt="UP Logo"
          className={`${currentSize.img} w-auto object-contain`}
        />
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Badge */}
      <div className="relative shrink-0 rounded-xl overflow-hidden border border-emerald-500/30 shadow-[0_0_15px_rgba(22,163,74,0.2)] bg-[#0B2D5B]/60 p-0.5">
        <img
          src="/brand/app-icon.png"
          alt="UP Engineering Club Logo"
          className={`${currentSize.img} w-auto object-contain rounded-lg`}
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-right leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-white ${currentSize.text}`}>
            النادي الهندسي
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
            UP
          </span>
        </div>

        {showSubtitle && (
          <span className={`font-mono text-gray-300/80 ${currentSize.sub} flex items-center gap-1 mt-0.5`}>
            <span>جامعة فلسطين</span>
            <span className="text-emerald-400">●</span>
            <span className="text-gray-400 font-sans">هندسة اليوم .. تصنع أثر الغد</span>
          </span>
        )}
      </div>
    </div>
  );
};
