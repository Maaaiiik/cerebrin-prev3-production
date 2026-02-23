import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// GET /api/agent/approvals
// Lista las aprobaciones del usuario (pending por defecto)
// Query params: ?status=pending&workspaceId=uuid
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status') ?? 'pending'
        const workspaceId = searchParams.get('workspaceId')

        let query = supabase
            .from('agent_approval_queue')
            .select(`
        id,
        action_type,
        action_title,
        action_description,
        action_payload,
        status,
        priority,
        expires_at,
        created_at,
        agents ( id, name, emoji )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (status !== 'all') query = query.eq('status', status)
        if (workspaceId) query = query.eq('workspace_id', workspaceId)

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ approvals: data ?? [], total: data?.length ?? 0 })
    } catch (error) {
        console.error('[GET /api/agent/approvals]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
