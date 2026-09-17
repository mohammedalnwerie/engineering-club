import React from 'react';

interface ClubLogoProps {
  variant?: 'full' | 'emblem' | 'horizontal' | 'icon';
  /** Background the logo sits on. 'dark' uses the light-stroke artwork (no white box). */
  theme?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

const LOGO_SRC = {
  dark: { emblem: '/brand/emblem-on-dark.png', horizontal: '/brand/logo-horizontal-on-dark.png' },
  light: { emblem: '/brand/emblem.png', horizontal: '/brand/logo-horizontal.png' },
};

export const ClubLogo: React.FC<ClubLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const src = LOGO_SRC[theme];

  if (variant === 'full') {
    const emblemSize = { sm: 'h-16 w-16', md: 'h-20 w-20', lg: 'h-24 w-24 sm:h-28 sm:w-28', xl: 'h-28 w-28 sm:h-36 sm:w-36' }[size];
    const textSize = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl sm:text-3xl', xl: 'text-3xl sm:text-4xl' }[size];
    const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center select-none ${className}`}>
        <img src={src.emblem} alt="شعار النادي الهندسي" className={`${emblemSize} object-contain`} />
        <div className="mt-4">
          <span className={`block font-black ${textSize} ${textColor} tracking-tight leading-tight`}>النادي الهندسي</span>
          {showSubtitle && (
            <span className="block text-sm font-semibold tracking-widest text-[#3FE7E3] mt-1">ENGINEERING CLUB</span>
          )}
          <span className="block text-sm text-gray-400 mt-0.5">جامعة فلسطين</span>
        </div>
      </div>
    );
  }

  if (variant === 'emblem' || variant === 'icon') {
    const emblemSize = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-16 w-16 sm:h-20 sm:w-20', xl: 'h-24 w-24 sm:h-32 sm:w-32' }[size];
    return (
      <img
        src={src.emblem}
        alt="شعار النادي الهندسي"
        className={`${emblemSize} object-contain shrink-0 select-none ${className}`}
      />
    );
  }

  const height = { sm: 'h-8', md: 'h-10', lg: 'h-10 sm:h-12', xl: 'h-14 sm:h-16' }[size];
  return (
    <img
      src={src.horizontal}
      alt="النادي الهندسي — Engineering Club"
      className={`${height} w-auto object-contain select-none ${className}`}
    />
  );
};
