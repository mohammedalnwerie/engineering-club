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
}) => {
  const sizeMap = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-16 sm:h-20',
    xl: 'h-24 sm:h-32',
  };

  const imgHeight = sizeMap[size];

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src={theme === 'dark' ? '/brand/logo-dark.png' : '/brand/logo.png'}
          alt="النادي الهندسي - جامعة فلسطين"
          className={`${imgHeight} w-auto object-contain drop-shadow-md`}
        />
      </div>
    );
  }

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        <img
          src="/brand/emblem.png"
          alt="شعار النادي الهندسي UP"
          className={`${imgHeight} w-auto object-contain`}
        />
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        <img
          src="/brand/app-icon.png"
          alt="UP Logo"
          className={`${imgHeight} w-auto object-contain`}
        />
      </div>
    );
  }

  // Horizontal variant (default for navbar, headers, footers)
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={theme === 'dark' ? '/brand/logo-horizontal-dark.png' : '/brand/logo-horizontal-light.png'}
        alt="النادي الهندسي - جامعة فلسطين | UP Engineering Club"
        className={`${imgHeight} w-auto object-contain transition-transform duration-200 hover:scale-[1.02]`}
      />
    </div>
  );
};
