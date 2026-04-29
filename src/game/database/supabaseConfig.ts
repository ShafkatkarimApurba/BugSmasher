// Supabase Configuration - Centralized for the app
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

function validateConfig(): void {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.warn('Supabase env vars are missing. Cloud features will be disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }
}

export function getSupabaseUrl(): string {
  validateConfig();
  return supabaseConfig.url;
}

export function getSupabaseAnonKey(): string {
  validateConfig();
  return supabaseConfig.anonKey;
}
