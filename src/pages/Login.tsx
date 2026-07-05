import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Sparkles, ShieldCheck, Zap, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { logSilentError } from '../lib/firestore-error';
import { VideoLoader } from '../components/VideoLoader';
import { motion } from 'motion/react';

export function Login() {
  const { user, userProfile, loading, logout, signInWithGoogle, signInWithFacebook, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const hasActioned = useRef(false);

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorError, setErrorError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      const isRedirectReturn = sessionStorage.getItem('oauth_in_progress') === 'true';
      if (isRedirectReturn) {
        hasActioned.current = true;
        sessionStorage.removeItem('oauth_in_progress');
      }

      if (userProfile?.onboarded) {
        if (mode === 'signup') {
          setMsg('An account already exists with this profile. Logging you in...');
          const timer = setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          return () => clearTimeout(timer);
        } else {
          navigate('/dashboard');
        }
      } else if (hasActioned.current) {
        navigate('/dashboard');
      } else {
        // If the user loaded the login page with an existing session that is NOT onboarded,
        // sign them out so they are not trapped and can sign in to their actual account.
        logout();
      }
    }
  }, [user, userProfile, loading, navigate, logout, mode]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorError(null);
    hasActioned.current = true;
    sessionStorage.setItem('oauth_in_progress', 'true');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      sessionStorage.removeItem('oauth_in_progress');
      hasActioned.current = false;
      setErrorError(error.message || 'Failed to sign in with Google');
      logSilentError(error as Error, { context: "handleGoogleLogin" });
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setErrorError(null);
    hasActioned.current = true;
    sessionStorage.setItem('oauth_in_progress', 'true');
    try {
      await signInWithFacebook();
    } catch (error: any) {
      sessionStorage.removeItem('oauth_in_progress');
      hasActioned.current = false;
      setErrorError(error.message || 'Failed to sign in with Facebook');
      logSilentError(error as Error, { context: "handleFacebookLogin" });
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setErrorError(null);
    hasActioned.current = true;
    sessionStorage.setItem('oauth_in_progress', 'true');
    try {
      await signInWithApple();
    } catch (error: any) {
      sessionStorage.removeItem('oauth_in_progress');
      hasActioned.current = false;
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
    if (mode === 'signin' || mode === 'signup') {
      hasActioned.current = true;
    }

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
      hasActioned.current = false;
      let friendlyError = error.message;
      if (error.code === 'auth/email-already-in-use') {
        friendlyError = 'An account with this email already exists. Please sign in instead.';
      } else if (error.code === 'auth/wrong-password') {
        friendlyError = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        friendlyError = 'No account found with this email. Please sign up instead.';
      }
      setErrorError(friendlyError);
      logSilentError(error as Error, { context: "handleSubmit" });
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <VideoLoader className="h-32 w-32 mx-auto scale-[1.5]" />
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen flex bg-[#FAF9F6] font-sans selection:bg-[#7C3AED] selection:text-white overflow-hidden">
      {/* Left side - Login Form Pane */}
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-between py-10 px-8 sm:px-16 relative overflow-hidden bg-[#FAF9F6]">
        {/* Subtle background glows */}
        <div className={`absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[80px] transition-all duration-700 pointer-events-none ${
          mode === 'signup' ? 'bg-[#7C3AED]/5' : 'bg-[#7C3AED]/3'
        }`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full blur-[80px] transition-all duration-700 pointer-events-none ${
          mode === 'signup' ? 'bg-[#7C3AED]/3' : 'bg-[#2583EB]/3'
        }`}></div>

        {/* Logo */}
        <div className="relative z-10 flex justify-start flex-shrink-0">
          <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" alt="Logo" className="h-9 w-auto object-contain" />
        </div>

        {/* Form Container (Subtle bordered boxless style, directly on bg canvas) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md mx-auto my-auto relative z-10 py-4"
        >
          {/* Heading */}
          <div className="mb-5">
            <h2 className="text-3xl font-bold font-display text-slate-800 tracking-tight mb-1.5">
              {mode === 'signin' ? 'Sign in to BrandToPost' : mode === 'signup' ? 'Create your account' : 'Reset password'}
            </h2>
            <p className="text-slate-500 text-sm font-semibold">
              {mode === 'signin' 
                ? 'Welcome back! Enter your details to continue.' 
                : mode === 'signup' 
                ? 'Join the ecosystem tailored for visionary builders.' 
                : 'Enter your email to receive a reset link.'}
            </p>
          </div>

          <div className="relative">
            {/* Custom Descriptive Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-[#FAF9F6]/95 z-30 flex flex-col items-center justify-center p-6 text-center transition-all animate-fade-in rounded-lg">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-[#7C3AED]/15 rounded-full blur-xl scale-125 animate-pulse" />
                  <img 
                    src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" 
                    alt="Tror Loading" 
                    className="w-16 h-16 object-contain animate-bounce"
                    style={{ animationDuration: '2.5s' }}
                  />
                </div>
                <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED] mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {mode === 'signup' 
                    ? 'Setting up your BrandToPost account...' 
                    : mode === 'signin' 
                    ? 'Securing your session...' 
                    : 'Sending password reset email...'}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-xs">
                  {mode === 'signup' 
                    ? 'Creating your profile & preparing the AI Agents...' 
                    : mode === 'signin'
                    ? 'Verifying credentials and loading workspace details...'
                    : 'Preparing reset link instructions...'}
                </p>
              </div>
            )}

            {/* Top Navigation Toggle / Back Button */}
            {mode === 'forgot' ? (
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorError(null); setMsg(null); }}
                className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#6d28d9] font-bold mb-5 transition-colors group focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Sign In
              </button>
            ) : (
              <div className="flex gap-6 border-b border-slate-200/60 pb-3 mb-5">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorError(null); setMsg(null); }}
                  className={`text-base font-semibold pb-2 transition-all relative focus:outline-none ${
                    mode === 'signin'
                      ? 'text-slate-800 font-bold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sign In
                  {mode === 'signin' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7C3AED] rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorError(null); setMsg(null); }}
                  className={`text-base font-semibold pb-2 transition-all relative focus:outline-none ${
                    mode === 'signup'
                      ? 'text-slate-800 font-bold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sign Up
                  {mode === 'signup' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7C3AED] rounded-full" />
                  )}
                </button>
              </div>
            )}

            {errorError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold text-center">
                {errorError}
              </div>
            )}
            
            {msg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold text-center">
                {msg}
              </div>
            )}

            {/* SSO compact button row */}
            {mode !== 'forgot' && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex justify-center items-center py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                  title={mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </button>

                <button
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="flex justify-center items-center py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                  title={mode === 'signup' ? 'Sign up with Apple' : 'Sign in with Apple'}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.458 3.608-2.924 1.15-1.688 1.626-3.324 1.65-3.411-.035-.015-3.203-1.22-3.238-4.887-.03-3.076 2.508-4.549 2.627-4.634-1.425-2.079-3.629-2.364-4.417-2.417-2.062-.124-4.004 1.209-4.508 1.209z" />
                    <path d="M15.021 4.542c.866-1.05 1.449-2.511 1.29-3.974-1.258.051-2.784.838-3.676 1.879-.797.904-1.488 2.4-1.306 3.826 1.411.11 2.822-.68 3.692-1.731z" />
                  </svg>
                </button>

                <button
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="flex justify-center items-center py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                  title={mode === 'signup' ? 'Sign up with Facebook' : 'Sign in with Facebook'}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="relative mt-5 mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#FAF9F6] px-3 text-slate-400 font-semibold">Or continue with email</span>
                </div>
              </div>
            )}

            {/* Email form inputs */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-slate-800 focus:bg-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all placeholder:text-slate-400 text-sm font-light shadow-sm"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Password</label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot'); setErrorError(null); setMsg(null); }}
                        className="text-xs text-[#7C3AED] hover:text-[#6d28d9] font-semibold transition-colors focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-11 pr-4 text-slate-800 focus:bg-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all placeholder:text-slate-400 text-sm font-light shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white font-semibold rounded-lg py-2.5 mt-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#7C3AED] hover:bg-[#6d28d9] active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : (
                  <>
                    {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="relative z-10 text-center text-[10px] text-slate-400 font-light flex-shrink-0">
          By signing in, you agree to our <Link to="/terms" className="underline hover:text-slate-350 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-slate-350 transition-colors">Privacy Policy</Link>.
        </div>
      </div>

      {/* Right side - Visual/Dashboard Mockup Pane (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] h-full relative bg-[#FAF9F6] border-l border-slate-200/60 p-10 flex-col justify-between overflow-hidden">
        {/* Soft decorative background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-[#7C3AED]/2 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Editorial Title */}
        <div className="relative z-10">
          <h1 className="text-2xl font-light tracking-tight text-slate-800 mb-1.5">
            Automate daily campaigns.
          </h1>
          <p className="text-slate-500 font-light text-xs max-w-md">
            Arthur, Chloe, and our roster of AI Specialists create, schedule, and refine your brand posts in real-time.
          </p>
        </div>

        {/* CSS-based Mockup of the BrandToPost Dashboard */}
        <div className="relative w-full h-[230px] bg-white border border-slate-200/80 rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.03)] overflow-hidden p-4 z-10 flex flex-col justify-between flex-shrink-0">
          {/* Mockup Header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold text-slate-400 ml-1 font-sans tracking-wide">BrandToPost Workspace</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
              <span className="text-[8px] font-semibold text-slate-400">Weekly View</span>
            </div>
          </div>

          {/* Mockup Grid */}
          <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
            {/* Calendar Post Column 1 */}
            <div className="border border-slate-100 rounded-lg p-2.5 bg-[#FAF9F6]/40 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-slate-400">Monday, May 5</span>
                <span className="text-[9px] text-slate-400 font-semibold">12:15 PM</span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#7C3AED] text-white flex items-center justify-center text-[7px] font-bold">in</span>
                  <span className="w-3.5 h-3.5 rounded bg-[#1DA1F2] text-white flex items-center justify-center text-[7px] font-bold">X</span>
                  <span className="text-[8px] font-bold text-[#7C3AED] ml-0.5">Arthur</span>
                </div>
                <div className="w-full h-14 bg-slate-100 rounded mb-1.5 overflow-hidden relative flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=300&auto=format&fit=crop&q=60" alt="Workplace Mockup" className="w-full h-full object-cover opacity-95" />
                </div>
                <p className="text-[8px] text-slate-600 line-clamp-1 leading-snug">
                  "Supporting local builders isn't just about code..."
                </p>
              </div>
            </div>

            {/* Calendar Post Column 2 */}
            <div className="border border-slate-100 rounded-lg p-2.5 bg-[#FAF9F6]/40 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-slate-400">Tuesday, May 6</span>
                <span className="text-[9px] text-slate-400 font-semibold">12:15 PM</span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-[#7C3AED] text-white flex items-center justify-center text-[7px] font-bold">in</span>
                  <span className="text-[8px] font-bold text-[#7C3AED] ml-0.5">Chloe</span>
                </div>
                <div className="w-full h-14 bg-slate-100 rounded mb-1.5 overflow-hidden relative flex-shrink-0">
                  <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=60" alt="Campaign Mockup" className="w-full h-full object-cover opacity-95" />
                </div>
                <p className="text-[8px] text-slate-600 line-clamp-1 leading-snug">
                  "We map corporate values directly to creative..."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tror Promotion Card (Statically aligned at the bottom) */}
        <div className="bg-[#7C3AED] text-white rounded-xl p-4 shadow-md border border-[#7C3AED]/20 z-20 flex justify-between items-center transition-all duration-300 relative flex-shrink-0">
          <div className="flex gap-3 items-center mr-2">
            {/* Mascot Icon */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md scale-110" />
              <img 
                src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" 
                alt="Tror Promo" 
                className="w-11 h-11 object-contain relative"
              />
            </div>
            {/* Promo text */}
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold mb-0.5">Tired of writing posts yourself?</h3>
              <p className="text-[10px] text-white/80 font-light leading-relaxed">
                Let Tror publish in your voice while you sleep.
              </p>
            </div>
          </div>
          
          {/* Action button */}
          <button 
            type="button"
            onClick={() => navigate('/dashboard/master-founder')}
            className="flex-shrink-0 bg-white hover:bg-slate-50 text-slate-900 text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-sm active:scale-[0.97]"
          >
            Activate
          </button>
        </div>
      </div>
    </div>
  );
}
