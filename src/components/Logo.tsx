import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const badgeSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-base',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
  };

  const titleSizes = {
    sm: 'text-sm font-black tracking-[0.2em]',
    md: 'text-lg font-black tracking-[0.25em]',
    lg: 'text-2xl font-black tracking-[0.3em]',
    xl: 'text-4xl font-black tracking-[0.35em]',
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-2.5">
        {/* Black angular badge with bold yellow "M" and red strip */}
        <div className="relative group select-none">
          {/* Angular polygon badge */}
          <div
            className={`${badgeSizes[size]} bg-black relative flex items-center justify-center border-2 border-zinc-800 shadow-[0_4px_20px_rgba(250,204,21,0.2)] rounded-md transform rotate-[-2deg] transition-transform duration-300 group-hover:rotate-0`}
            style={{
              clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)',
            }}
          >
            {/* Red accent strip on left edge */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />

            {/* Bold Yellow 'M' */}
            <span className="font-extrabold text-[#FACC15] tracking-tighter transform -skew-x-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              M
            </span>

            {/* Subtle top reflection strip */}
            <div className="absolute top-0 right-0 left-3 h-0.5 bg-yellow-400/40" />
          </div>

          {/* Underglow accent */}
          <div className="absolute -bottom-1 left-2 right-2 h-1 bg-[#EF4444]/40 blur-sm -z-10 rounded-full" />
        </div>

        {/* Brand Name "MEHFIL" with wide letter-spacing */}
        <div className="flex flex-col">
          <div className={`${titleSizes[size]} text-white uppercase font-sans flex items-center`}>
            <span>MEH</span>
            <span className="text-[#FACC15]">FIL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] ml-1 mb-1 inline-block animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* Brand Tagline: "Apna andaz. Apni mehfil." */}
      {showTagline && (
        <p className={`${taglineSizes[size]} text-zinc-400 font-medium tracking-wider mt-1.5 text-center`}>
          <span className="text-zinc-300">Apna andaz.</span>{' '}
          <span className="text-[#FACC15] font-semibold">Apni mehfil.</span>
        </p>
      )}
    </div>
  );
};
