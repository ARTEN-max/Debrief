import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn.js';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  default: 'bg-white dark:bg-gray-900',
  elevated: 'bg-white dark:bg-gray-900 shadow-lg',
  outlined: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn('rounded-xl', variantStyles[variant], paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}
