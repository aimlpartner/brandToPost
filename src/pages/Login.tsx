import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogIn, Sparkles, ShieldCheck, ShieldAlert, Zap, Mail, Lock, ArrowRight, Loader2, ArrowLeft,
  LayoutDashboard, Award, Image, Megaphone, Clapperboard, Calendar, Settings,
  Brain, LogOut, Instagram, Send, Copy, Download, Heart, MessageCircle, Bookmark
} from 'lucide-react';
import { logSilentError } from '../lib/firestore-error';
import { VideoLoader } from '../components/VideoLoader';
import { motion } from 'motion/react';
import { ThemeToggle } from '../components/ThemeToggle';

export function Login() {
  const { user, userProfile, loading, logout, signInWithGoogle, signInWithFacebook, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasActioned = useRef(false);

  // Determine initial mode from query parameter
  const queryMode = searchParams.get('mode');
  const initialMode = queryMode === 'signup' ? 'signup' : queryMode === 'forgot' ? 'forgot' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorError, setErrorError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Update mode state if search parameter changes (e.g. user clicks nav link again)
  useEffect(() => {
    const currentQueryMode = searchParams.get('mode');
    if (currentQueryMode === 'signup' && mode !== 'signup') {
      setMode('signup');
    } else if (currentQueryMode === 'forgot' && mode !== 'forgot') {
      setMode('forgot');
    } else if ((!currentQueryMode || currentQueryMode === 'signin') && mode !== 'signin') {
      setMode('signin');
    }
  }, [searchParams]);

  const handleModeChange = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setErrorError(null);
    setMsg(null);
    if (newMode === 'signup') {
      setSearchParams({ mode: 'signup' }, { replace: true });
    } else if (newMode === 'forgot') {
      setSearchParams({ mode: 'forgot' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  useEffect(() => {
    if (user && !loading) {
      if (userProfile?.isLocked) {
        logout();
        return;
      }

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
        // redirect them to onboarding so they can complete it.
        navigate('/onboarding');
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

  const isFormValid = email && (mode === 'forgot' || password);

  return (
    <div className="h-screen max-h-screen flex bg-white font-sans selection:bg-[#7C3AED] selection:text-white overflow-hidden">
      {/* Left side - Login Form Pane */}
      <div className="w-full lg:w-[45%] h-full flex flex-col justify-between py-10 px-8 sm:px-16 relative overflow-hidden bg-white">
        {/* Subtle background glows */}
        <div className={`absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[80px] transition-all duration-700 pointer-events-none ${
          mode === 'signup' ? 'bg-[#7C3AED]/3' : 'bg-[#7C3AED]/2'
        }`}></div>
        <div className={`absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full blur-[80px] transition-all duration-700 pointer-events-none ${
          mode === 'signup' ? 'bg-[#7C3AED]/2' : 'bg-[#2583EB]/2'
        }`}></div>

        {/* Logo & Theme Toggle */}
        <div className="relative z-10 flex items-center justify-between flex-shrink-0">
          <img src="/B2PLOGO.png" alt="Logo" className="h-9 w-auto object-contain" />
          <ThemeToggle variant="icon" />
        </div>

        {/* Form Container */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto my-auto relative z-10 py-4"
        >
          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight text-center mb-2 font-display">
              {mode === 'signin' ? 'Welcome to BrandToPost!' : mode === 'signup' ? 'Create your Account' : 'Reset password'}
            </h2>
            <div className="text-center text-sm font-semibold">
              {mode === 'signin' ? (
                <>
                  <span className="text-slate-400">Don't have an account? </span>
                  <button 
                    type="button" 
                    onClick={() => handleModeChange('signup')}
                    className="text-slate-650 hover:text-slate-800 underline focus:outline-none transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  <span className="text-slate-400">Already have an account? </span>
                  <button 
                    type="button" 
                    onClick={() => handleModeChange('signin')}
                    className="text-slate-650 hover:text-slate-800 underline focus:outline-none transition-colors"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <span className="text-slate-400">Enter your email to reset your credentials.</span>
              )}
            </div>
          </div>

          <div className="relative">
            {/* Custom Descriptive Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-6 text-center transition-all animate-fade-in rounded-lg">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-[#7C3AED]/15 rounded-full blur-xl scale-125 animate-pulse" />
                  <img 
                    src="/B2P AVATAR.png" 
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

            {/* Top Back Button in Forgot Mode */}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold mb-5 transition-colors group focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Sign In
              </button>
            )}

            {(searchParams.get('locked') === 'true' || searchParams.get('reason')) && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5 text-rose-700 font-extrabold text-sm uppercase tracking-wide">
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                  <span>Testing Phase Completed</span>
                </div>
                <div className="text-xs font-semibold text-rose-900 leading-relaxed">
                  {searchParams.get('reason') ? decodeURIComponent(searchParams.get('reason')!) : 'The testing phase is over. Access to your account has been suspended by administration.'}
                </div>
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

            {/* Vertical Stack Social Buttons */}
            {mode !== 'forgot' && (
              <div className="space-y-2.5 mb-5">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none text-slate-700 font-semibold text-sm"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none text-slate-700 font-semibold text-sm"
                >
                  <svg className="w-5 h-5 mr-3 fill-current text-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Continue with Facebook
                </button>

                <button
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none text-slate-700 font-semibold text-sm"
                >
                  <svg className="w-5 h-5 mr-3 fill-current text-black" viewBox="0 0 24 24">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.458 3.608-2.924 1.15-1.688 1.626-3.324 1.65-3.411-.035-.015-3.203-1.22-3.238-4.887-.03-3.076 2.508-4.549 2.627-4.634-1.425-2.079-3.629-2.364-4.417-2.417-2.062-.124-4.004 1.209-4.508 1.209z" />
                    <path d="M15.021 4.542c.866-1.05 1.449-2.511 1.29-3.974-1.258.051-2.784.838-3.676 1.879-.797.904-1.488 2.4-1.306 3.826 1.411.11 2.822-.68 3.692-1.731z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="relative mt-6 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-semibold">
                    {mode === 'signup' ? 'Or create account with email' : 'Or sign in with email'}
                  </span>
                </div>
              </div>
            )}

            {/* Email form inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all placeholder:text-slate-400 text-sm font-semibold shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        onClick={() => handleModeChange('forgot')}
                        className="text-xs text-[#7C3AED] hover:text-[#6d28d9] font-semibold transition-colors focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 transition-all placeholder:text-slate-400 text-sm font-semibold shadow-sm"
                      placeholder="Enter Password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
                  isFormValid 
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-[0.99]' 
                    : 'bg-[#C2C2C2] text-white cursor-not-allowed'
                }`}
              >
                {isLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : (
                  <>
                    {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="relative z-10 text-center text-xs text-slate-400 font-normal leading-relaxed flex-shrink-0">
          {mode === 'signup' ? (
            <>
              By signing up, you agree to the <br />
              <Link to="/terms" className="underline hover:text-slate-800 transition-colors">Terms of Service</Link>, and <Link to="/privacy" className="underline hover:text-slate-800 transition-colors">Privacy Policy</Link>.
            </>
          ) : (
            <>
              By signing in, you agree to the <br />
              <Link to="/terms" className="underline hover:text-slate-800 transition-colors">Terms of Service</Link>, and <Link to="/privacy" className="underline hover:text-slate-800 transition-colors">Privacy Policy</Link>.
            </>
          )}
        </div>
      </div>

      {/* Right side - Visual/Dashboard Mockup Pane (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] h-full relative bg-[#F4F4F6] border-l border-slate-200/60 overflow-hidden items-center justify-center">
        {/* Soft decorative background glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-[#7C3AED]/2 rounded-full blur-[100px] pointer-events-none" />

        {/* MacBook Pro 14 Mockup Image (Partially cut off at the right and bottom) */}
        <div className="absolute bottom-0 right-0 w-[165%] xl:w-[150%] pointer-events-none select-none translate-x-[28%] translate-y-[15%] transition-all duration-300">
          <img 
            src="/MacBook Pro 14.png" 
            alt="MacBook Pro Mockup" 
            className="w-full h-auto object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.18)]"
          />
        </div>
      </div>
    </div>
  );
}
