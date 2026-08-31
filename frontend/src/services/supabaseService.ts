/**
 * Supabase client service for frontend.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_DEFAULT_URL = 'https://aatnuqokeyofougubmxj.supabase.co';
const SUPABASE_DEFAULT_ANON_KEY = 'sb_publishable_4-99QTWa60adk-jqhFoSdQ_1OmOJ5cz';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_ANON_KEY;

// Create Supabase client with auth session persistence
let supabase: SupabaseClient;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  supabase = createClient(SUPABASE_DEFAULT_URL, SUPABASE_DEFAULT_ANON_KEY);
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
