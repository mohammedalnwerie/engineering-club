import React from 'react';

interface ClubLogoProps {
  variant?: 'full' | 'emblem' | 'horizontal' | 'icon';
  theme?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  withPod?: boolean;
}

export const ClubLogo: React.FC<ClubLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  className = '',
  size = 'md',
  showSubtitle = true,
  withPod = true,
}) => {
  const sizeMap = {
    sm: { img: 'h-7 w-7 sm:h-8 sm:w-8', pod: 'p-1.5 rounded-xl', text: 'text-sm sm:text-base', sub: 'text-[8px] sm:text-[9px]' },
    md: { img: 'h-9 w-9 sm:h-10 sm:w-10', pod: 'p-2 rounded-2xl', text: 'text-base sm:text-lg', sub: 'text-[9px] sm:text-[10px]' },
    lg: { img: 'h-16 w-16 sm:h-20 sm:w-20', pod: 'p-3 rounded-2xl', text: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm' },
    xl: { img: 'h-24 w-24 sm:h-32 sm:w-32', pod: 'p-5 rounded-3xl', text: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base' },
  };

  const currentSize = sizeMap[size];
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';

  const renderEmblem = (customImgClass = '', customPodClass = '') => {
    const emblemImg = (
      <img
        src="/brand/emblem.png"
        alt="شعار النادي الهندسي"
        className={`${customImgClass || currentSize.img} object-contain filter drop-shadow-[0_0_1.5px_rgba(255,255,255,0.75)] drop-shadow-[0_4px_12px_rgba(63,231,227,0.35)] drop-shadow-[0_8px_24px_rgba(127,26,178,0.3)] transition-all duration-300 group-hover:scale-105 select-none shrink-0 relative z-10`}
      />
    );

    if (!withPod) {
      return emblemImg;
    }

    return (
      <div
        className={`relative inline-flex items-center justify-center ${customPodClass || currentSize.pod} bg-gradient-to-b from-white/[0.14] via-white/[0.04] to-white/[0.01] border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-md transition-all duration-300 group-hover:border-[#3FE7E3]/60 group-hover:shadow-[0_0_25px_rgba(63,231,227,0.25)] shrink-0`}
      >
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />
        {emblemImg}
      </div>
    );
  };

  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center select-none group ${className}`}>
        {renderEmblem(
          currentSize.img,
          'p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-white/[0.16] via-[#381C4A]/40 to-white/[0.02] border border-white/25 shadow-[0_8px_35px_rgba(0,0,0,0.6),inset_0_1.5px_0_rgba(255,255,255,0.35)] backdrop-blur-md'
        )}
        <div className="mt-4">
          <span className={`block font-black ${currentSize.text} ${textColor} tracking-tight leading-tight`}>
            النادي الهندسي
          </span>
          {showSubtitle && (
            <span className={`block font-mono ${currentSize.sub} font-semibold tracking-widest text-[#3FE7E3] uppercase mt-1`}>
              ENGINEERING CLUB
            </span>
          )}
          <span className="block text-[10px] sm:text-xs text-gray-400 font-sans mt-0.5">
            جامعة فلسطين
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none group ${className}`}>
        {renderEmblem()}
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none group ${className}`}>
        {renderEmblem()}
      </div>
    );
  }

  // Horizontal variant (default for navbar, headers, footers)
  return (
    <div className={`inline-flex items-center gap-3 select-none text-right group ${className}`}>
      {renderEmblem()}
      <div className="flex flex-col leading-none">
        <span className={`font-black ${currentSize.text} ${textColor} tracking-tight`}>
          النادي الهندسي
        </span>
        {showSubtitle && (
          <span className={`font-mono ${currentSize.sub} font-semibold tracking-wider text-[#3FE7E3] uppercase mt-1`}>
            ENGINEERING CLUB
          </span>
        )}
        <span className="text-[9px] sm:text-[10px] text-gray-400 font-sans mt-0.5">
          جامعة فلسطين
        </span>
      </div>
    </div>
  );
};
