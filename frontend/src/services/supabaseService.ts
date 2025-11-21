/**
 * Supabase client service for frontend.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if both are provided, otherwise create with empty strings (will fail gracefully)
let supabase: SupabaseClient;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    // Create a dummy client to prevent errors (auth won't work but app will load)
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
    console.warn('⚠️ Supabase environment variables not set. Auth features will not work.');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Create dummy client as fallback
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

// Auth helpers
export const authService = {
  async signUp(email: string, password: string) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabaseUrl || !supabaseAnonKey) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async getSession() {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  async signInWithGoogle() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase not configured');
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabaseUrl || !supabaseAnonKey) {
      // Return a dummy subscription that does nothing
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

