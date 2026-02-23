import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";

let clientInstance: any;

// Client for client-side usage (public) - uses @supabase/ssr for sync
export const supabaseClient = (() => {
    if (typeof window === "undefined") return createBrowserClient(supabaseUrl, supabaseAnonKey);
    if (!clientInstance) {
        clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return clientInstance;
})();

// Admin client for server-side usage (service role)
// ONLY use this in server components or API routes
export const supabaseAdmin = typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null as any; // Prevent accidental client-side usage
