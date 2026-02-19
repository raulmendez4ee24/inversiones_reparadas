import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface BentoItemProps {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'large' | 'wide' | 'tall';
  glowColor?: 'cyan' | 'purple' | 'mixed';
}

export function BentoItem({ 
  children, 
  className = '', 
  size = 'default',
  glowColor = 'mixed'
}: BentoItemProps) {
  const sizeClasses = {
    default: '',
    large: 'md:col-span-2 md:row-span-2',
    wide: 'md:col-span-2',
    tall: 'md:row-span-2',
  };

  const glowStyles = {
    cyan: 'hover:shadow-cyber-glow',
    purple: 'hover:shadow-purple-glow',
    mixed: '',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`
        relative bg-steel-gray/50 border border-terminal-gray/50 rounded-xl overflow-hidden
        transition-all duration-500 group
        hover:border-cyber-cyan/50
        ${sizeClasses[size]}
        ${glowStyles[glowColor]}
        ${className}
      `}
    >
      {/* Gradient border */}
      <span 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          padding: '1px',
          background: glowColor === 'mixed' 
            ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.5) 0%, transparent 30%, transparent 70%, rgba(184, 41, 247, 0.5) 100%)'
            : glowColor === 'cyan'
            ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.5) 0%, transparent 100%)'
            : 'linear-gradient(135deg, transparent 0%, rgba(184, 41, 247, 0.5) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Inner glow */}
      <span 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: glowColor === 'mixed'
            ? 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.05) 0%, rgba(184, 41, 247, 0.05) 100%)'
            : glowColor === 'cyan'
            ? 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(184, 41, 247, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full p-6">
        {children}
      </div>
    </motion.div>
  );
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

export default function BentoGrid({ children, className = '', columns = 4 }: BentoGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${columnClasses[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}
