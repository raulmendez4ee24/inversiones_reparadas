import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Cpu, Shield, Zap, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useOTP, setUseOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const { login, requestLoginOTP, loginWithOTP } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (useOTP) {
        if (!otpSent) {
          await requestLoginOTP(email);
          setOtpSent(true);
        } else {
          await loginWithOTP(email, otp);
          navigate('/dashboard');
        }
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] ambient-glow opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ambient-glow ambient-glow--purple opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="relative bg-steel-gray/30 backdrop-blur-xl border border-terminal-gray/50 rounded-2xl overflow-hidden">
          {/* Border gradient */}
          <div className="absolute inset-0 rounded-2xl p-[1px]">
            <div 
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, transparent 50%, rgba(184, 41, 247, 0.3) 100%)',
              }}
            />
          </div>

          <div className="relative p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl mb-4">
                <Cpu className="w-8 h-8 text-cyber-cyan" />
              </div>
              <h1 className="font-display text-2xl font-bold text-frost-white mb-1">
                KAN LOGIC
              </h1>
              <p className="font-mono text-xs text-ghost-white tracking-widest">
                ARQUITECTURA IA
              </p>
            </div>

            {/* Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-void-black/50 rounded-lg">
              <button
                type="button"
                onClick={() => { setUseOTP(false); setOtpSent(false); setError(''); }}
                className={`flex-1 py-2 px-4 text-xs font-mono tracking-wider rounded transition-all ${
                  !useOTP 
                    ? 'bg-cyber-cyan/20 text-cyber-cyan' 
                    : 'text-ghost-white hover:text-frost-white'
                }`}
              >
                CONTRASEÑA
              </button>
              <button
                type="button"
                onClick={() => { setUseOTP(true); setError(''); }}
                className={`flex-1 py-2 px-4 text-xs font-mono tracking-wider rounded transition-all ${
                  useOTP 
                    ? 'bg-cyber-cyan/20 text-cyber-cyan' 
                    : 'text-ghost-white hover:text-frost-white'
                }`}
              >
                OTP
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-error-crimson/10 border border-error-crimson/30 rounded-lg mb-4"
              >
                <AlertCircle className="w-4 h-4 text-error-crimson flex-shrink-0" />
                <span className="text-sm text-error-crimson">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                  CORREO ELECTRÓNICO
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                  />
                </div>
              </div>

              {/* Password or OTP */}
              {!useOTP ? (
                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    CONTRASEÑA
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-gray hover:text-frost-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    {otpSent ? 'CÓDIGO OTP' : 'ENVIAR CÓDIGO'}
                  </label>
                  {otpSent ? (
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-lg tracking-[0.5em] text-center"
                    />
                  ) : (
                    <p className="text-sm text-ghost-white py-3">
                      Te enviaremos un código de 6 dígitos
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full relative overflow-hidden group"
              >
                <div className={`
                  px-6 py-4 border rounded-lg font-mono text-sm tracking-widest uppercase transition-all
                  ${isLoading 
                    ? 'bg-steel-gray/30 border-terminal-gray text-ghost-white/50 cursor-not-allowed' 
                    : 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20 hover:shadow-cyber-glow'}
                `}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      PROCESANDO...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      {useOTP && !otpSent ? 'ENVIAR CÓDIGO' : 'INICIAR SESIÓN'}
                    </span>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Links */}
            <div className="mt-6 flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-ghost-white hover:text-cyber-cyan transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link to="/register" className="text-cyber-cyan hover:underline">
                Crear cuenta
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="mt-8 pt-6 border-t border-terminal-gray/30">
              <p className="text-xs text-ghost-white text-center mb-3">Credenciales de demo:</p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 bg-void-black/30 rounded">
                  <span className="text-ghost-white">Super Admin</span>
                  <span className="text-cyber-cyan">admin@kanlogic.systems / admin123</span>
                </div>
                <div className="flex justify-between p-2 bg-void-black/30 rounded">
                  <span className="text-ghost-white">Org Admin</span>
                  <span className="text-cyber-cyan">demo@empresa.com / demo123</span>
                </div>
                <div className="flex justify-between p-2 bg-void-black/30 rounded">
                  <span className="text-ghost-white">Org User</span>
                  <span className="text-cyber-cyan">user@empresa.com / user123</span>
                </div>
              </div>
            </div>

            {/* Security badges */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-terminal-gray">
                <Shield className="w-3 h-3" />
                <span className="text-[8px] font-mono">SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-1 text-terminal-gray">
                <Cpu className="w-3 h-3" />
                <span className="text-[8px] font-mono">AI Protection</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
