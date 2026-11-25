'use client';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary' && 'bg-rose text-white hover:bg-rose-dark shadow-lg shadow-rose/20 hover:shadow-rose/30',
          variant === 'secondary' && 'bg-elevated text-foreground hover:bg-border',
          variant === 'outline' && 'border border-border text-foreground hover:border-rose hover:text-rose bg-transparent',
          variant === 'ghost' && 'text-secondary hover:text-foreground hover:bg-white/5 bg-transparent',
          variant === 'gold' && 'bg-gradient-to-r from-gold-dark to-gold text-background font-bold shadow-lg shadow-gold/20',
          size === 'sm' && 'px-4 py-2 text-xs',
          size === 'md' && 'px-6 py-2.5 text-sm',
          size === 'lg' && 'px-8 py-3.5 text-base',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
