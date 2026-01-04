import React from 'react';

interface BrandedBadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandedBadge: React.FC<BrandedBadgeProps> = ({
  text,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-neon-cyan/20 via-neon-pink/20 to-neon-yellow/20 border-neon-cyan/50 text-neon-cyan',
    success: 'bg-neon-green/20 border-neon-green/50 text-neon-green',
    warning: 'bg-neon-yellow/20 border-neon-yellow/50 text-neon-yellow',
    info: 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
  };

  return (
    <span
      className={`
        branded-badge
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {text}
    </span>
  );
};
