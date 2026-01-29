import { Target } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Target className={`${iconSizes[size]} text-accent`} />
        <div className="absolute inset-0 animate-pulse-glow rounded-full" />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${textSizes[size]} font-bold text-primary tracking-tight`}>
            WAR ROOM
          </span>
          <span className="text-xs text-secondary font-medium tracking-widest uppercase">
            Investment Calculator
          </span>
        </div>
      )}
    </div>
  );
}
