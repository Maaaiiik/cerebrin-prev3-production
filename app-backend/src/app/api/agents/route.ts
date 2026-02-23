import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(authHeader: string) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    )
}

// ─────────────────────────────────────────────
// GET /api/agents
// Lista los agentes del usuario autenticado
// Query: ?workspaceId=uuid
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = getSupabase(authHeader)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const workspaceId = searchParams.get('workspaceId')

        let query = supabase
            .from('agents')
            .select('id, name, emoji, persona, hitl_level, maturity_mode, resonance_score, is_active, created_at')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: true })

        if (workspaceId) query = query.eq('workspace_id', workspaceId)

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ agents: data ?? [] })
    } catch (error) {
        console.error('[GET /api/agents]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

// ─────────────────────────────────────────────
// POST /api/agents
// Crear un nuevo agente para el usuario
// Body: { workspaceId, name, emoji?, persona?, hitlLevel?, systemPrompt? }
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = getSupabase(authHeader)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const body = await req.json()
        const {
            workspaceId,
            name,
            emoji = '🤖',
            persona,
            hitlLevel = 'plan_only',
            systemPrompt,
        } = body

        if (!workspaceId || !name) {
            return NextResponse.json({ error: 'workspaceId y name son requeridos' }, { status: 400 })
        }

        const VALID_HITL = ['full_manual', 'plan_only', 'result_only', 'autonomous']
        if (!VALID_HITL.includes(hitlLevel)) {
            return NextResponse.json({ error: 'hitlLevel inválido' }, { status: 400 })
        }

        // Verificar que el user pertenece al workspace
        const { data: membership } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', workspaceId)
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No perteneces a ese workspace' }, { status: 403 })
        }

        const { data: agent, error } = await supabase
            .from('agents')
            .insert({
                workspace_id: workspaceId,
                owner_id: user.id,
                name,
                emoji,
                persona: persona ?? `Soy ${name}, tu asistente personal de IA. Estoy aquí para ayudarte a ser más productivo.`,
                hitl_level: hitlLevel,
                system_prompt: systemPrompt ?? null,
                maturity_mode: 'observer',    // Siempre empieza observando
                resonance_score: 0,
                is_active: true,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ agent }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/agents]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
