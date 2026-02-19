import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: boolean;
  glowOnHover?: boolean;
  scanLines?: boolean;
  borderGradient?: boolean;
}

export default function CyberCard({
  children,
  className = '',
  hoverScale = true,
  glowOnHover = true,
  scanLines = true,
  borderGradient = true,
}: CyberCardProps) {
  return (
    <motion.div
      whileHover={hoverScale ? { y: -4, scale: 1.02 } : {}}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`
        relative bg-deep-void border border-terminal-gray rounded-lg p-6 overflow-hidden
        transition-all duration-500
        hover:border-transparent
        ${glowOnHover ? 'hover:shadow-card-glow' : ''}
        ${className}
      `}
    >
      {/* Gradient border effect */}
      {borderGradient && (
        <span 
          className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            padding: '1px',
            background: 'linear-gradient(135deg, #00F0FF 0%, #B829F7 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Ambient glow */}
      {glowOnHover && (
        <span 
          className="absolute -inset-px rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Scan lines effect */}
      {scanLines && (
        <span 
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 240, 255, 0.03) 2px, rgba(0, 240, 255, 0.03) 4px)',
          }}
        />
      )}

      {/* Corner decorations */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
