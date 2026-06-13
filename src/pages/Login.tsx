import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Sparkles, ShieldCheck, Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { logSilentError } from '../lib/firestore-error';
import { VideoLoader } from '../components/VideoLoader';
import { motion } from 'motion/react';

export function Login() {
  const { user, loading, signInWithGoogle, signInWithFacebook, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorError, setErrorError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setErrorError(error.message || 'Failed to sign in with Google');
      logSilentError(error as Error, { context: "handleGoogleLogin" });
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setErrorError(null);
    try {
      await signInWithFacebook();
    } catch (error: any) {
      setErrorError(error.message || 'Failed to sign in with Facebook');
      logSilentError(error as Error, { context: "handleFacebookLogin" });
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setErrorError(null);
    try {
      await signInWithApple();
    } catch (error: any) {
      setErrorError(error.message || 'Failed to sign in with Apple');
      logSilentError(error as Error, { context: "handleAppleLogin" });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorError(null);
    setMsg(null);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMsg('Password reset email sent. Please check your inbox.');
      }
    } catch (error: any) {
      let friendlyError = error.message;
      if (error.code === 'auth/email-already-in-use') friendlyError = 'Email already in use';
      if (error.code === 'auth/wrong-password') friendlyError = 'Incorrect password';
      if (error.code === 'auth/user-not-found') friendlyError = 'User not found';
      setErrorError(friendlyError);
      logSilentError(error as Error, { context: "handleSubmit" });
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <VideoLoader className="h-32 w-32 mx-auto scale-[1.5]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-[#7C3AED] selection:text-white">
      {/* Left side - Visual/Brand Pane (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-50 to-white/90 border-r border-slate-200/80 p-12 flex-col justify-between">
        {/* Abstract animated light orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#7C3AED]/5 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[600px] h-[600px] bg-[#2583EB]/5 rounded-full blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.015)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none" />

        {/* Content Top */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="h-10 w-auto">
             <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" alt="Logo" className="h-[46px] -ml-2 object-contain drop-shadow-md" />
          </div>
        </motion.div>

        {/* Content Middle */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-sm font-semibold text-slate-600">The Ultimate AI Workflow</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl lg:text-7xl font-normal font-display text-slate-800 tracking-tight leading-[1.1] mb-6"
          >
            Design. Build. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#2583EB] font-bold">
              Accelerate.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-slate-500 font-light max-w-lg leading-relaxed mb-12"
          >
            Join the ecosystem tailored for visionary builders. Create daily campaigns, generate flawless copy, and automate your creative pipelines instantly.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-6"
          >
            <div className="flex -space-x-4">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" alt="User" className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm" />
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces" alt="User" className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm" />
              <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Tror" className="w-12 h-12 rounded-full border-2 border-white bg-[#7C3AED] object-cover shadow-sm" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-amber-500">
                {[1,2,3,4,5].map(i => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
              </div>
              <span className="text-sm font-semibold text-slate-500 mt-1">Trusted by 10k+ creators</span>
            </div>
          </motion.div>
        </div>

        {/* Ambient Tror Avatar Floating */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-12 z-0 hidden xl:block opacity-75"
        >
          <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Tror Avatar" className="w-[300px] h-[300px] object-contain drop-shadow-[0_20px_50px_rgba(124,58,237,0.25)] hover:scale-105 transition-all duration-700" />
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-slate-50/50">
        {/* Mobile background glows */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-[80px] lg:hidden"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#2583EB]/5 rounded-full blur-[80px] lg:hidden"></div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden mb-12">
            <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" alt="Logo" className="h-14 w-auto mx-auto object-contain drop-shadow-md" />
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold font-display text-slate-800 tracking-tight mb-2">
              {mode === 'signin' ? 'Sign in to your account' : mode === 'signup' ? 'Create an account' : 'Reset password'}
            </h2>
            <p className="text-slate-500 text-sm font-semibold">
              {mode === 'signin' 
                ? 'Welcome back! Enter your details to continue.' 
                : mode === 'signup' 
                ? 'New to BrandToPost? Sign up below.' 
                : 'Enter your email to receive a reset link.'}
            </p>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)] relative">
            
            {errorError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
                {errorError}
              </div>
            )}
            
            {msg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold text-center">
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 focus:bg-white focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-slate-400 text-sm font-medium"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot'); setErrorError(null); setMsg(null); }}
                        className="text-xs text-[#7C3AED] hover:text-[#6d28d9] font-bold transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-800 focus:bg-white focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-slate-400 text-sm font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#7C3AED] hover:bg-[#6d28d9] text-white font-bold rounded-xl py-3 mt-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#7C3AED]/10 hover:shadow-[#7C3AED]/20 active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative mt-6 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-slate-400 font-bold">Or continue with</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl py-2.5 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>

              <button
                onClick={handleAppleLogin}
                disabled={isLoading}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.458 3.608-2.924 1.15-1.688 1.626-3.324 1.65-3.411-.035-.015-3.203-1.22-3.238-4.887-.03-3.076 2.508-4.549 2.627-4.634-1.425-2.079-3.629-2.364-4.417-2.417-2.062-.124-4.004 1.209-4.508 1.209z" />
                  <path d="M15.021 4.542c.866-1.05 1.449-2.511 1.29-3.974-1.258.051-2.784.838-3.676 1.879-.797.904-1.488 2.4-1.306 3.826 1.411.11 2.822-.68 3.692-1.731z" />
                </svg>
                Apple
              </button>

              <button
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-slate-500 font-medium">
              {mode === 'signin' ? (
                <p>
                  New to BrandToPost?{' '}
                  <button onClick={() => { setMode('signup'); setErrorError(null); setMsg(null); }} className="text-[#7C3AED] hover:text-[#6d28d9] font-bold transition-colors focus:outline-none">Sign up</button>
                </p>
              ) : mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => { setMode('signin'); setErrorError(null); setMsg(null); }} className="text-[#7C3AED] hover:text-[#6d28d9] font-bold transition-colors focus:outline-none">Sign in</button>
                </p>
              ) : (
                <p>
                  Remember your password?{' '}
                  <button onClick={() => { setMode('signin'); setErrorError(null); setMsg(null); }} className="text-[#7C3AED] hover:text-[#6d28d9] font-bold transition-colors focus:outline-none">Sign in</button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
