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
    sm: { img: 'h-8 sm:h-9', text: 'text-base sm:text-lg', sub: 'text-[9px] sm:text-[10px]' },
    md: { img: 'h-10 sm:h-12', text: 'text-lg sm:text-xl', sub: 'text-[10px] sm:text-xs' },
    lg: { img: 'h-16 sm:h-20', text: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm' },
    xl: { img: 'h-24 sm:h-32', text: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base' },
  };

  const currentSize = sizeMap[size];
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';

  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center select-none ${className}`}>
        <img
          src="/brand/emblem.png"
          alt="شعار النادي الهندسي"
          className={`${currentSize.img} w-auto object-contain drop-shadow-[0_10px_25px_rgba(127,26,178,0.35)] transition-transform duration-300 hover:scale-105`}
        />
        <div className="mt-3.5">
          <span className={`block font-black ${currentSize.text} ${textColor} tracking-tight leading-tight`}>
            النادي الهندسي
          </span>
          {showSubtitle && (
            <span className={`block font-mono ${currentSize.sub} font-semibold tracking-widest text-[#3FE7E3] uppercase mt-1`}>
              ENGINEERING CLUB
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        <img
          src="/brand/emblem.png"
          alt="شعار النادي الهندسي"
          className={`${currentSize.img} w-auto object-contain transition-transform duration-300 hover:scale-105`}
        />
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        <img
          src="/brand/app-icon.png"
          alt="أيقونة النادي الهندسي"
          className={`${currentSize.img} w-auto object-contain`}
        />
      </div>
    );
  }

  // Horizontal variant (default for navbar, headers, footers)
  return (
    <div className={`inline-flex items-center gap-3 select-none text-right ${className}`}>
      <img
        src="/brand/emblem.png"
        alt="شعار النادي الهندسي"
        className={`${currentSize.img} w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0 drop-shadow-[0_2px_12px_rgba(127,26,178,0.25)]`}
      />
      <div className="flex flex-col leading-none">
        <span className={`font-black ${currentSize.text} ${textColor} tracking-tight`}>
          النادي الهندسي
        </span>
        {showSubtitle && (
          <span className={`font-mono ${currentSize.sub} font-semibold tracking-wider text-[#3FE7E3] uppercase mt-1`}>
            ENGINEERING CLUB
          </span>
        )}
      </div>
    </div>
  );
};
