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
// GET /api/agent/memory
// Query: ?category=clientes&active=true&agentId=uuid
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = getSupabase(authHeader)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const category = searchParams.get('category')
        const activeOnly = searchParams.get('active') !== 'false' // true por defecto
        const agentId = searchParams.get('agentId')

        let query = supabase
            .from('agent_memory')
            .select('id, title, content, category, memory_type, is_active, tags, expires_at, created_at, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (category) query = query.eq('category', category)
        if (activeOnly) query = query.eq('is_active', true)
        if (agentId) query = query.eq('agent_id', agentId)

        const { data, error } = await query
        if (error) throw error

        // Agrupar por categoría si no se filtra por una
        if (!category) {
            const grouped = (data ?? []).reduce((acc: Record<string, unknown[]>, item) => {
                const cat = item.category as string
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(item)
                return acc
            }, {})
            return NextResponse.json({ memories: grouped, total: data?.length ?? 0 })
        }

        return NextResponse.json({ memories: data ?? [], total: data?.length ?? 0 })
    } catch (error) {
        console.error('[GET /api/agent/memory]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

// ─────────────────────────────────────────────
// POST /api/agent/memory
// Crear nueva entrada de memoria
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = getSupabase(authHeader)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const body = await req.json()
        const { agentId, workspaceId, title, content, category = 'profesional', memoryType = 'long_term', tags } = body

        if (!title || !content || !workspaceId) {
            return NextResponse.json({ error: 'title, content y workspaceId son requeridos' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('agent_memory')
            .insert({
                agent_id: agentId ?? null,
                workspace_id: workspaceId,
                user_id: user.id,
                title,
                content: typeof content === 'string' ? { text: content } : content,
                category,
                memory_type: memoryType,
                tags: tags ?? [],
                is_active: true,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ memory: data }, { status: 201 })
    } catch (error) {
        console.error('[POST /api/agent/memory]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
