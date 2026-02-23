/**
 * Supabase Client - Cliente configurado para Cerebrin
 * Cerebrin v3.0
 * 
 * NOTA: Este archivo está preparado pero NO se usa hasta que conectes Supabase.
 * Para activarlo:
 * 1. Instalar: npm install @supabase/supabase-js
 * 2. Crear .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
 * 3. Descomentar el código
 */

/*
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using mock data mode.');
}

// ============================================================
// CLIENT
// ============================================================

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ============================================================
// AUTH HELPERS
// ============================================================

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, metadata?: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// ============================================================
// REALTIME HELPERS
// ============================================================

export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================
// STORAGE HELPERS
// ============================================================

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
    });

  if (error) throw error;
  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
*/

// ============================================================
// MOCK MODE (cuando Supabase no está configurado)
// ============================================================

export const supabase = null;

export function signInWithEmail() {
  throw new Error('Supabase not configured. Using mock data mode.');
}

export function signUpWithEmail() {
  throw new Error('Supabase not configured. Using mock data mode.');
}

export function signOut() {
  console.log('Mock sign out');
}

export function getCurrentSession() {
  return null;
}

export function getCurrentUser() {
  return null;
}

export function subscribeToTable() {
  return () => {};
}

export function uploadFile() {
  throw new Error('Supabase not configured.');
}

export function getPublicUrl() {
  return '';
}
