import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// POST /api/agent/approvals/[id]
// Resolver una aprobación (aprobar o rechazar)
// Body: { action: 'approve' | 'reject', feedback?: string }
// ─────────────────────────────────────────────
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const body = await req.json()
        const { action, feedback } = body

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'action debe ser "approve" o "reject"' }, { status: 400 })
        }

        // Verificar que la aprobación pertenece a este usuario
        const { data: approval, error: fetchError } = await supabase
            .from('agent_approval_queue')
            .select('id, status, user_id')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !approval) {
            return NextResponse.json({ error: 'Aprobación no encontrada' }, { status: 404 })
        }

        if (approval.status !== 'pending') {
            return NextResponse.json({ error: 'Esta aprobación ya fue resuelta' }, { status: 409 })
        }

        // Llamar a la función SQL que resuelve la aprobación
        // y actualiza automáticamente el resonance_score del agente
        const { error: resolveError } = await supabase.rpc('resolve_approval', {
            v_approval_id: params.id,
            v_status: action === 'approve' ? 'approved' : 'rejected',
            v_feedback: feedback ?? null,
        })

        if (resolveError) throw resolveError

        return NextResponse.json({
            success: true,
            approvalId: params.id,
            newStatus: action === 'approve' ? 'approved' : 'rejected',
            message: action === 'approve'
                ? 'Aprobado. El agente ejecutará la acción.'
                : 'Rechazado. El agente aprendió de esta decisión.',
        })
    } catch (error) {
        console.error('[POST /api/agent/approvals/[id]]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

// ─────────────────────────────────────────────
// GET /api/agent/approvals/[id]
// Obtener el detalle de una aprobación específica
// ─────────────────────────────────────────────
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { data, error } = await supabase
            .from('agent_approval_queue')
            .select('*, agents ( id, name, emoji, maturity_mode, resonance_score )')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()

        if (error || !data) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

        return NextResponse.json({ approval: data })
    } catch (error) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
