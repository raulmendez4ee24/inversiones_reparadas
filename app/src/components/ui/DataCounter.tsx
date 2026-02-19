import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface DataCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  label?: string;
  className?: string;
  variant?: 'cyan' | 'purple' | 'green';
}

export default function DataCounter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2,
  label,
  className = '',
  variant = 'cyan',
}: DataCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const hasAnimated = useRef(false);

  const colorVariants = {
    cyan: 'text-cyber-cyan',
    purple: 'text-neon-purple',
    green: 'text-matrix-green',
  };

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function (ease-out-cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = easeOut * endValue;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <div ref={ref} className={`text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className={`font-mono text-4xl lg:text-5xl font-bold ${colorVariants[variant]} tabular-nums`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        <span className="text-ghost-white">{prefix}</span>
        <span className="relative">
          {formattedValue}
          {/* Glitch effect on hover */}
          <span className="absolute inset-0 opacity-0 hover:opacity-100 animate-glitch text-error-crimson pointer-events-none">
            {formattedValue}
          </span>
        </span>
        <span className="text-ghost-white">{suffix}</span>
      </motion.div>
      
      {label && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-2 font-mono text-xs text-ghost-white tracking-widest uppercase"
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}

// Mini counter for real-time updates
interface MiniDataCounterProps {
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MiniDataCounter({ value, label, trend = 'neutral', className = '' }: MiniDataCounterProps) {
  const trendColors = {
    up: 'text-matrix-green',
    down: 'text-error-crimson',
    neutral: 'text-cyber-cyan',
  };

  const trendIcons = {
    up: '▲',
    down: '▼',
    neutral: '—',
  };

  return (
    <div className={`flex items-center justify-between py-2 px-3 bg-steel-gray/30 rounded border border-terminal-gray/30 ${className}`}>
      <span className="font-mono text-[10px] text-ghost-white tracking-wider uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm font-semibold ${trendColors[trend]}`}>
          {value.toLocaleString()}
        </span>
        <span className={`text-[10px] ${trendColors[trend]}`}>{trendIcons[trend]}</span>
      </div>
    </div>
  );
}
