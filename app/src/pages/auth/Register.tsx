import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Building2, Eye, EyeOff, Cpu, CheckCircle2, ArrowLeft, Zap } from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  
  const { register } = useAuth();

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword) {
      setError('Todos los campos son requeridos');
      return false;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, name, orgName);
      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center p-4">
        <div className="absolute inset-0 grid-bg opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md text-center"
        >
          <div className="bg-steel-gray/30 backdrop-blur-xl border border-matrix-green/30 rounded-2xl p-8">
            <div className="w-20 h-20 bg-matrix-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-matrix-green" />
            </div>
            <h2 className="font-display text-2xl font-bold text-frost-white mb-2">
              ¡Cuenta Creada!
            </h2>
            <p className="text-ghost-white mb-6">
              Tu cuenta ha sido creada exitosamente. Revisa tu correo para confirmar tu email.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 transition-colors rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              IR AL LOGIN
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl mb-3">
                <Cpu className="w-6 h-6 text-cyber-cyan" />
              </div>
              <h1 className="font-display text-xl font-bold text-frost-white">
                Crear Cuenta
              </h1>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-cyber-cyan' : 'bg-terminal-gray'}`} />
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-cyber-cyan' : 'bg-terminal-gray'}`} />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-error-crimson/10 border border-error-crimson/30 rounded-lg mb-4"
              >
                <span className="text-sm text-error-crimson">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {step === 1 ? (
                <div className="space-y-4">
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
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
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
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-4 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 hover:shadow-cyber-glow transition-all rounded-lg"
                  >
                    <span className="flex items-center justify-center gap-2">
                      CONTINUAR
                      <Zap className="w-4 h-4" />
                    </span>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                      TU NOMBRE
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Juan Pérez"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                      NOMBRE DE TU EMPRESA
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Mi Empresa SA"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setStep(1)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 border border-terminal-gray text-ghost-white font-mono text-sm tracking-widest hover:border-cyber-cyan hover:text-cyber-cyan transition-all rounded-lg"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        ATRÁS
                      </span>
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-[2] px-6 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 hover:shadow-cyber-glow transition-all rounded-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          CREANDO...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          CREAR CUENTA
                          <Zap className="w-4 h-4" />
                        </span>
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <span className="text-ghost-white text-sm">¿Ya tienes cuenta? </span>
              <Link to="/login" className="text-cyber-cyan hover:underline text-sm">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
