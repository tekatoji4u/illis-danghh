import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'color' | 'white';
  showSlogan?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VietinBankLogo: React.FC<LogoProps> = ({
  className = '',
  variant = 'color',
  showSlogan = true,
  size = 'md'
}) => {
  const isWhite = variant === 'white';
  const textColor = isWhite ? 'text-white' : 'text-[#005993]';
  const sloganColor = isWhite ? 'text-white/80' : 'text-[#005993]';
  const coinBlue = isWhite ? '#ffffff' : '#005993';
  const coinRed = isWhite ? 'rgba(255, 255, 255, 0.85)' : '#D71249';

  const sizeClasses = {
    sm: { symbol: 'w-7 h-7', title: 'text-lg', slogan: 'text-[9px]' },
    md: { symbol: 'w-9 h-9', title: 'text-2xl', slogan: 'text-[11px]' },
    lg: { symbol: 'w-12 h-12', title: 'text-3xl', slogan: 'text-[13px]' }
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official VietinBank Emblem - Coin symbol */}
      <div className={`relative ${sizeClasses.symbol} flex-shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Top Arch - Blue (Heaven) */}
          <path
            d="M 50 8 C 26.8 8 8 26.8 8 50 C 8 50.8 8.03 51.5 8.1 52.2 C 14.5 45.5 28.5 41 42 41 H 58 C 71.5 41 85.5 45.5 91.9 52.2 C 91.97 51.5 92 50.8 92 50 C 92 26.8 73.2 8 50 8 Z"
            fill={coinBlue}
          />
          {/* Inner Square/Window top notch */}
          <path
            d="M 38 41 C 38 47.5 43.5 53 50 53 C 56.5 53 62 47.5 62 41 H 38 Z"
            fill={coinBlue}
          />

          {/* Bottom Arch - Red (Earth / Prosperity) */}
          <path
            d="M 8.1 52.2 C 11.2 75 30.5 92 50 92 C 69.5 92 88.8 75 91.9 52.2 C 84.5 45.8 71.5 43 58 43 H 42 C 28.5 43 15.5 45.8 8.1 52.2 Z"
            fill={coinRed}
          />
          {/* Center negative space accent */}
          <circle cx="50" cy="50" r="13" fill={isWhite ? '#004d80' : '#ffffff'} />
          <rect x="42" y="42" width="16" height="16" rx="2" fill={coinBlue} fillOpacity="0.15" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className={`font-black tracking-tight ${textColor} ${sizeClasses.title} font-sans`}>
          Vietin<span className="font-bold">Bank</span>
        </div>
        {showSlogan && (
          <div className={`font-medium tracking-wide mt-1 uppercase ${sloganColor} ${sizeClasses.slogan}`}>
            Nâng giá trị cuộc sống
          </div>
        )}
      </div>
    </div>
  );
};
