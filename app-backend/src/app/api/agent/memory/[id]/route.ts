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
// PATCH /api/agent/memory/[id]
// Actualizar: activar/desactivar, editar título, contenido, tags
// Body: { isActive?, title?, content?, tags?, category? }
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
        const updates: Record<string, unknown> = {}

        if (body.isActive !== undefined) updates.is_active = body.isActive
        if (body.title !== undefined) updates.title = body.title
        if (body.content !== undefined) updates.content = typeof body.content === 'string'
            ? { text: body.content }
            : body.content
        if (body.tags !== undefined) updates.tags = body.tags
        if (body.category !== undefined) updates.category = body.category

        const { data, error } = await supabase
            .from('agent_memory')
            .update(updates)
            .eq('id', params.id)
            .eq('user_id', user.id) // RLS doble check
            .select()
            .single()

        if (error || !data) return NextResponse.json({ error: 'Memoria no encontrada o sin permiso' }, { status: 404 })

        return NextResponse.json({ memory: data })
    } catch (error) {
        console.error('[PATCH /api/agent/memory/[id]]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

// ─────────────────────────────────────────────
// DELETE /api/agent/memory/[id]
// Eliminar permanentemente una entrada de memoria
// ─────────────────────────────────────────────
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const supabase = getSupabase(authHeader)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

        const { error } = await supabase
            .from('agent_memory')
            .delete()
            .eq('id', params.id)
            .eq('user_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true, deletedId: params.id })
    } catch (error) {
        console.error('[DELETE /api/agent/memory/[id]]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
