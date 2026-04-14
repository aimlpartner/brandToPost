import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Sparkles } from 'lucide-react';
import { logSilentError } from '../lib/firestore-error';

export function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      logSilentError(error as Error, { context: "handleLogin" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6347]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-[#fafafa]">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#ff6347]/30 rounded-full blur-3xl mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#ffe066]/30 rounded-full blur-3xl mix-blend-multiply"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-gradient-to-br from-[#ff6347] to-[#ffe066] rounded-2xl flex items-center justify-center shadow-lg border border-white/40">
            <Sparkles className="h-8 w-8 text-[#111827]" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-bold text-[#111827] font-display">
          <span className="text-3xl tracking-tight font-display text-[#111827]">
            <span className="font-extrabold">Brand</span>
            <span className="font-light text-[#ff6347]">ToPost</span>
          </span>
        </h2>
        <p className="mt-3 text-center text-lg text-[#111827]/70 font-light">
          Sign in to access your dashboard and manage your campaigns.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel py-10 px-6 sm:px-10">
          <button
            onClick={handleLogin}
            className="w-full glass-button-primary py-3 px-4 text-base font-semibold flex justify-center items-center gap-2 text-[#111827]"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
