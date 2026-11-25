'use client';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'gold' | 'success' | 'new';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider',
        variant === 'default' && 'bg-elevated text-secondary',
        variant === 'premium' && 'bg-rose/15 text-rose-light border border-rose/20',
        variant === 'gold' && 'bg-gold/15 text-gold-light border border-gold/20',
        variant === 'success' && 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        variant === 'new' && 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
        className
      )}
    >
      {children}
    </span>
  );
}
