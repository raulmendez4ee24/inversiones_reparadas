import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, ArrowLeft, CheckCircle2, Cpu, Zap, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialToken = useMemo(() => params.get('token') ?? '', [params]);

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (password !== confirm) return setError('Las contraseñas no coinciden');

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4">
      <div className="absolute inset-0 grid-bg opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="relative bg-steel-gray/30 backdrop-blur-xl border border-terminal-gray/50 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 rounded-2xl p-[1px]">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, transparent 50%, rgba(184, 41, 247, 0.3) 100%)',
              }}
            />
          </div>

          <div className="relative p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl mb-3">
                <Cpu className="w-6 h-6 text-cyber-cyan" />
              </div>
              <h1 className="font-display text-xl font-bold text-frost-white">
                Restablecer Contraseña
              </h1>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-crimson/10 border border-error-crimson/30 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 text-error-crimson flex-shrink-0" />
                <span className="text-sm text-error-crimson">{error}</span>
              </div>
            )}

            {done ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-matrix-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-matrix-green" />
                </div>
                <p className="text-ghost-white">Contraseña actualizada. Redirigiendo…</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    TOKEN
                  </label>
                  <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Pega el token aquí"
                    required
                    className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    NUEVA CONTRASEÑA
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

                <div>
                  <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    CONFIRMAR CONTRASEÑA
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 hover:shadow-cyber-glow transition-all rounded-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      PROCESANDO...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      ACTUALIZAR
                    </span>
                  )}
                </motion.button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-ghost-white hover:text-cyber-cyan transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

