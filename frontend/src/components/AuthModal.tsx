import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { authService } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  // Check if Supabase is configured
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    setIsSupabaseConfigured(!!(supabaseUrl && supabaseKey));
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await authService.signUp(email, password);
        setError('Check your email to confirm your account!');
        setTimeout(() => {
          setIsSignUp(false);
          setError('');
        }, 3000);
      } else {
        await authService.signIn(email, password);
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await authService.signInWithGoogle();
      // Google OAuth will redirect, so we don't need to handle success here
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            {isSignUp ? 'Sign up to save your notes permanently' : 'Sign in to access your saved notes'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Supabase not configured</p>
            <p className="text-xs text-yellow-800 mb-3">
              To enable authentication, create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in the frontend directory with:
            </p>
            <pre className="text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
            </pre>
            <p className="text-xs text-yellow-800 mt-2">
              Get your keys from <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a> → Project Settings → API
            </p>
          </div>
        )}

        {error && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            error.includes('Check your email') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || !isSupabaseConfigured}
            className="w-full flex items-center justify-center gap-2 border border-stone-300 py-2 rounded-lg font-medium hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-stone-600">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
                className="text-slate-900 font-medium hover:underline"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                className="text-slate-900 font-medium hover:underline"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

