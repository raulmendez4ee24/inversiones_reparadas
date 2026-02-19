import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CyberButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function CyberButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  icon,
  className = '',
  disabled = false,
}: CyberButtonProps) {
  const baseStyles = 'relative overflow-hidden font-mono tracking-widest uppercase transition-all duration-300 group';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  };

  const variantStyles = {
    primary: `
      bg-transparent border border-cyber-cyan text-cyber-cyan
      hover:bg-cyber-cyan/10 hover:shadow-cyber-glow
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      bg-transparent border border-terminal-gray text-ghost-white
      hover:border-neon-purple hover:text-neon-purple hover:shadow-purple-glow
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
      bg-transparent border border-transparent text-ghost-white
      hover:text-cyber-cyan hover:border-cyber-cyan/30
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      href={href}
      onClick={onClick}
      type={href ? undefined : type}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {/* Laser scan effect */}
      {variant === 'primary' && (
        <span className="absolute inset-0 overflow-hidden">
          <span 
            className="absolute top-0 left-0 w-full h-full -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)',
            }}
          />
        </span>
      )}

      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute top-0 right-0 w-1 h-1 border-t border-r border-current opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-current opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    </Component>
  );
}
