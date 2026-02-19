/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Kan Logic Hyper-Tech Palette
        'void-black': '#000000',
        'deep-void': '#050508',
        'cyber-cyan': '#00F0FF',
        'neon-purple': '#B829F7',
        'electric-violet': '#7C3AED',
        'matrix-green': '#00FF88',
        'alert-amber': '#FFB800',
        'error-crimson': '#FF3366',
        'steel-gray': '#1A1A2E',
        'frost-white': '#E0E0E0',
        'ghost-white': '#A0A0B0',
        'terminal-gray': '#4A4A5A',
        
        // shadcn defaults
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'cyber-glow': '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3)',
        'purple-glow': '0 0 20px rgba(184, 41, 247, 0.5), 0 0 40px rgba(184, 41, 247, 0.3)',
        'card-glow': '0 0 30px rgba(0, 240, 255, 0.2), inset 0 0 30px rgba(0, 240, 255, 0.05)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px rgba(0, 240, 255, 0.5)" },
          "50%": { opacity: "0.7", boxShadow: "0 0 40px rgba(0, 240, 255, 0.8)" },
        },
        "float": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(50px, -50px)" },
          "50%": { transform: "translate(0, -100px)" },
          "75%": { transform: "translate(-50px, -50px)" },
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "glitch": {
          "0%, 90%, 100%": { transform: "translate(0)" },
          "92%": { transform: "translate(-2px, 2px)" },
          "94%": { transform: "translate(2px, -2px)" },
          "96%": { transform: "translate(-2px, -2px)" },
          "98%": { transform: "translate(2px, 2px)" },
        },
        "data-stream": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "counter": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 10s ease-in-out infinite",
        "scan": "scan 2s linear infinite",
        "glitch": "glitch 2s infinite",
        "data-stream": "data-stream 1s linear infinite",
        "spin-slow": "spin-slow 20s linear infinite",
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00F0FF 0%, #B829F7 100%)',
        'gradient-void': 'linear-gradient(180deg, #000000 0%, #050508 100%)',
        'glow-cyan': 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)',
        'glow-purple': 'radial-gradient(circle, rgba(184,41,247,0.3) 0%, transparent 70%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
