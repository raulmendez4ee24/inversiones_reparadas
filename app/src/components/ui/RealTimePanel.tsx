import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Minus, Cpu, Zap, Database, MessageSquare } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  suffix?: string;
  trend: 'up' | 'down' | 'neutral';
  change?: number;
}

interface RealTimePanelProps {
  title?: string;
  className?: string;
}

export default function RealTimePanel({ title = 'MÉTRICAS EN TIEMPO REAL', className = '' }: RealTimePanelProps) {
  const [data, setData] = useState<DataPoint[]>([
    { label: 'RESPUESTAS/HR', value: 847, suffix: '', trend: 'up', change: 12 },
    { label: 'LEADS CAPTURADOS', value: 156, suffix: '', trend: 'up', change: 8 },
    { label: 'TIEMPO AHORRADO', value: 42, suffix: 'h', trend: 'up', change: 15 },
    { label: 'SATISFACCIÓN', value: 94, suffix: '%', trend: 'neutral', change: 0 },
  ]);

  const [sparklineData, setSparklineData] = useState<number[]>(Array(20).fill(50));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(item => {
        const change = (Math.random() - 0.5) * (item.value * 0.05);
        const newValue = Math.max(0, item.value + change);
        const newTrend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral';
        return {
          ...item,
          value: Math.round(newValue),
          trend: newTrend,
          change: Math.abs(Math.round(change)),
        };
      }));

      // Update sparkline
      setSparklineData(prev => {
        const newData = [...prev.slice(1), 40 + Math.random() * 40];
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Draw sparkline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;

    sparklineData.forEach((value, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - (value / 100) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [sparklineData]);

  const trendIcons = {
    up: <TrendingUp className="w-3 h-3 text-matrix-green" />,
    down: <TrendingDown className="w-3 h-3 text-error-crimson" />,
    neutral: <Minus className="w-3 h-3 text-ghost-white" />,
  };

  const trendColors = {
    up: 'text-matrix-green',
    down: 'text-error-crimson',
    neutral: 'text-ghost-white',
  };

  return (
    <div className={`bg-deep-void border border-terminal-gray/50 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span className="font-mono text-xs text-ghost-white tracking-widest">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-matrix-green rounded-full animate-pulse" />
          <span className="font-mono text-[10px] text-matrix-green">LIVE</span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-4">
        <canvas 
          ref={canvasRef}
          width={300}
          height={60}
          className="w-full h-12"
        />
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-steel-gray/30 rounded p-3 border border-terminal-gray/30"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9px] text-ghost-white tracking-wider">{item.label}</span>
              {trendIcons[item.trend]}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg font-bold text-cyber-cyan tabular-nums">
                {item.value.toLocaleString()}{item.suffix}
              </span>
              {item.change !== undefined && item.change > 0 && (
                <span className={`font-mono text-[10px] ${trendColors[item.trend]}`}>
                  {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}{item.change}%
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-terminal-gray/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-ghost-white" />
            <span className="font-mono text-[9px] text-ghost-white">12%</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-ghost-white" />
            <span className="font-mono text-[9px] text-ghost-white">2.4ms</span>
          </div>
        </div>
        <span className="font-mono text-[9px] text-terminal-gray">
          ACTUALIZADO: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function MiniRealTimePanel({ className = '' }: { className?: string }) {
  const [metrics, setMetrics] = useState([
    { icon: MessageSquare, label: 'MSGS', value: 1247, color: 'text-cyber-cyan' },
    { icon: Database, label: 'DATA', value: 89, suffix: 'GB', color: 'text-neon-purple' },
    { icon: Activity, label: 'UPTIME', value: 99.9, suffix: '%', color: 'text-matrix-green' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.label === 'MSGS' 
          ? m.value + Math.floor(Math.random() * 10)
          : m.value + (Math.random() - 0.5) * 0.1
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-4 px-4 py-2 bg-steel-gray/50 rounded-lg border border-terminal-gray/30 ${className}`}>
      {metrics.map((metric, i) => (
        <div key={metric.label} className="flex items-center gap-2">
          <metric.icon className={`w-3 h-3 ${metric.color}`} />
          <span className="font-mono text-[10px] text-ghost-white">{metric.label}</span>
          <span className={`font-mono text-xs font-semibold ${metric.color} tabular-nums`}>
            {metric.value.toFixed(metric.value % 1 === 0 ? 0 : 1)}{metric.suffix}
          </span>
          {i < metrics.length - 1 && (
            <span className="w-px h-3 bg-terminal-gray ml-2" />
          )}
        </div>
      ))}
    </div>
  );
}
