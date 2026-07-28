import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Sparkles, ShieldCheck, Mail, Lock, ArrowRight, Loader2, MessageSquare, Bot } from 'lucide-react';
import { logSilentError } from '../lib/firestore-error';
import { motion } from 'motion/react';

export function WhatsAppLogin() {
  const { user, userProfile, loading, logout, signInWithGoogle, signInWithFacebook, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorError, setErrorError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      if (userProfile?.isLocked) {
        logout();
        return;
      }
      navigate('/whatsapp/dashboard');
    }
  }, [user, userProfile, loading, navigate, logout]);

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
      <div className="min-h-screen bg-[#070b0d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-emerald-400">
          <Loader2 className="h-10 w-10 animate-spin" />
          <span className="text-xs font-mono tracking-widest text-[#00A884]">LOADING WHATSAPP CORE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#070b0d] font-sans selection:bg-[#00a884]/30 selection:text-white relative">
      
      {/* Background ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#00a884]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#25d366]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />



      {/* Left side - Visual/Brand Pane (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0c1214] border-r border-white/5 p-12 flex-col justify-between">
        
        {/* Content Top */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-3.5"
        >
          <div className="p-2.5 rounded-2xl bg-[#00A884]/15 border border-[#00A884]/35 text-[#00A884] shadow-[0_0_15px_rgba(0,168,132,0.1)]">
            <MessageSquare className="h-6 w-6" />
          </div>
          <span className="text-xl tracking-wider font-display text-white font-bold">TROR WHATSAPP OUTREACH</span>
        </motion.div>

        {/* Content Middle */}
        <div className="relative z-10 my-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 shadow-inner"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">Dedicated Business Core</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl lg:text-6xl font-normal font-display text-white tracking-tight leading-[1.1] mb-6"
          >
            WhatsApp <br/>
            Onboarding & <br/>
            <span className="text-emerald-400 font-bold">
              Inbound Growth.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base text-gray-400 font-light max-w-md leading-relaxed mb-12"
          >
            The ultimate standalone portal built specifically to link local businesses, automate pipeline scraping triggers, configure response variables, and run native outbound chats.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-6"
          >
            <div className="flex -space-x-3.5">
              <div className="w-11 h-11 rounded-full border-2 border-[#070b0d] bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">A</div>
              <div className="w-11 h-11 rounded-full border-2 border-[#070b0d] bg-teal-600 flex items-center justify-center text-white font-bold text-xs">M</div>
              <div className="w-11 h-11 rounded-full border-2 border-[#070b0d] bg-slate-800 flex items-center justify-center text-white font-bold text-xs">R</div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-mono tracking-wider">● SYSTEM IS SECURED & ACTIVE</span>
              <span className="text-xs text-gray-500 font-sans mt-0.5">Assuring full compliance under official Meta APIs</span>
            </div>
          </motion.div>
        </div>

        {/* Content Bottom footer */}
        <div className="text-xs text-gray-500 font-mono">
          &copy; {new Date().getFullYear()} Tror Systems. Client-Side Onboarding Layer.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[#0a0f12]">
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo on mini screen */}
          <div className="flex flex-col items-center justify-center lg:hidden mb-8">
            <div className="p-3.5 rounded-2xl bg-[#00A884]/15 border border-[#00A884]/35 text-[#00A884] mb-3">
              <MessageSquare className="h-8 w-8" />
            </div>
            <span className="text-sm tracking-widest font-mono text-white font-bold uppercase">WhatsApp Management Portal</span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold font-display text-white tracking-tight mb-2">
              {mode === 'signin' ? 'Sign in to Bot Manager' : mode === 'signup' ? 'Create Bot Account' : 'Reset password'}
            </h2>
            <p className="text-gray-400 text-sm font-semibold">
              {mode === 'signin' 
                ? 'Authorized credentials required to check outbound logs.' 
                : mode === 'signup' 
                ? 'Set up your dedicated admin logins.' 
                : 'Enter your email to receive a reset link.'}
            </p>
          </div>

          <div className="bg-[#11161a] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,168,132,0.06)] relative">
            
            {errorError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold text-center">
                {errorError}
              </div>
            )}
            
            {msg && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold text-center">
                {msg}
              </div>
            )}
 
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#181e23] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:bg-[#1f262c] focus:outline-none focus:border-[#00a884] transition-all placeholder:text-gray-600 text-sm font-medium"
                    placeholder="admin@tror-wa.com"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Security Password</label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot'); setErrorError(null); setMsg(null); }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#181e23] border border-[#white]/10 rounded-xl py-3 pl-11 pr-4 text-white focus:bg-[#1f262c] focus:outline-none focus:border-[#00a884] transition-all placeholder:text-gray-600 text-sm font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00a884] hover:bg-[#008f72] text-white font-bold rounded-xl py-3 mt-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#00a884]/10 hover:shadow-[#00a884]/20 active:scale-[0.98] cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {mode === 'signin' ? 'Unlock Dashboard' : mode === 'signup' ? 'Create & Sign In' : 'Send Credentials link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative mt-6 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#11161a] px-4 text-gray-500 font-bold font-mono">SOCIAL VERIFICATION</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-[#181e23] hover:bg-[#1f262c] text-white border border-white/5 rounded-xl py-2.5 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer"
              >
                <svg className="w-5 h-5 font-bold" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Admin Check
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 font-medium">
              {mode === 'signin' ? (
                <p>
                  Need administrative access?{' '}
                  <button onClick={() => { setMode('signup'); setErrorError(null); setMsg(null); }} className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors focus:outline-none">Sign up</button>
                </p>
              ) : mode === 'signup' ? (
                <p>
                  Already have bot credentials?{' '}
                  <button onClick={() => { setMode('signin'); setErrorError(null); setMsg(null); }} className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors focus:outline-none">Sign in</button>
                </p>
              ) : (
                <p>
                  Remember your password?{' '}
                  <button onClick={() => { setMode('signin'); setErrorError(null); setMsg(null); }} className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors focus:outline-none">Sign in</button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
