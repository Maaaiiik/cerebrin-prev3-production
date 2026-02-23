import { NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's session data including the SuperAdmin claim.
 */
export async function GET() {
    // In a real implementation, this would use the access token from the cookie
    // and fetch the actual profile + metadata from Supabase Auth.
    return NextResponse.json({
        id: "admin-uuid",
        email: "admin@cerebrin.ai",
        name: "Comandante Admin",
        avatar_url: null,
        workspace_id: "master-admin-ws",
        is_super_admin: true
    });
}
