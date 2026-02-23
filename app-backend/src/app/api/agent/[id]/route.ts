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
// GET /api/agent/[id]
// Obtener la configuración completa del agente
// ─────────────────────────────────────────────
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = getSupabase(authHeader)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const { data: agent, error } = await supabase
            .from('agents')
            .select(`
        id, name, emoji, persona, description,
        hitl_level, maturity_mode, resonance_score,
        system_prompt, is_active, capabilities,
        created_at, updated_at
      `)
            .eq('id', params.id)
            .eq('owner_id', user.id)
            .single()

        if (error || !agent) {
            return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
        }

        // Obtener estadísticas básicas del agente
        const { count: approvals } = await supabase
            .from('agent_approval_queue')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', params.id)
            .eq('status', 'approved')

        const { count: memories } = await supabase
            .from('agent_memory')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', params.id)
            .eq('is_active', true)

        return NextResponse.json({
            agent,
            stats: {
                totalApprovals: approvals ?? 0,
                activeMemories: memories ?? 0,
            },
        })
    } catch (error) {
        console.error('[GET /api/agent/[id]]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

// ─────────────────────────────────────────────
// PATCH /api/agent/[id]
// Actualizar configuración del agente:
//   - nombre, emoji, persona, descripción
//   - hitl_level (nivel de autonomía)
//   - system_prompt personalizado
//   - is_active
// ─────────────────────────────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = getSupabase(authHeader)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const body = await req.json()

        // Solo permitir actualizar campos específicos (whitelist)
        const ALLOWED = ['name', 'emoji', 'persona', 'description', 'hitl_level', 'system_prompt', 'is_active', 'capabilities']
        const updates: Record<string, unknown> = {}

        for (const key of ALLOWED) {
            if (body[key] !== undefined) {
                // Convertir camelCase a snake_case donde aplica
                const dbKey = key === 'hitlLevel' ? 'hitl_level'
                    : key === 'systemPrompt' ? 'system_prompt'
                        : key === 'isActive' ? 'is_active'
                            : key
                updates[dbKey] = body[key]
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 })
        }

        // Validar hitl_level si viene en el cuerpo
        if (updates.hitl_level && !['full_manual', 'plan_only', 'result_only', 'autonomous'].includes(updates.hitl_level as string)) {
            return NextResponse.json({ error: 'hitl_level inválido' }, { status: 400 })
        }

        const { data: agent, error } = await supabase
            .from('agents')
            .update(updates)
            .eq('id', params.id)
            .eq('owner_id', user.id) // Seguridad: solo el owner puede editar
            .select()
            .single()

        if (error || !agent) {
            return NextResponse.json({ error: 'Agente no encontrado o sin permiso' }, { status: 404 })
        }

        return NextResponse.json({ agent, updated: Object.keys(updates) })
    } catch (error) {
        console.error('[PATCH /api/agent/[id]]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
