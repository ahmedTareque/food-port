'use client';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-orange text-white hover:bg-brand-primary-hover active:scale-95 shadow-lg shadow-brand-orange/20',
  secondary:
    'bg-white border border-brand-border text-brand-white hover:bg-brand-steel',
  ghost: 'bg-transparent text-brand-chrome hover:text-brand-white hover:bg-black/5',
  danger: 'bg-brand-danger-light border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/15',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, disabled, className = '', children, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-body font-semibold
        transition-all duration-150 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...rest}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
export default Button;
