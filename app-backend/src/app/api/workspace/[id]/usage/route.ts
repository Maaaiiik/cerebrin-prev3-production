import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// GET /api/workspace/[id]/usage
// Consumo de tokens del workspace actual
// Retorna: tokens totales, costo estimado, modelo más usado
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

        const { searchParams } = new URL(req.url)
        const period = searchParams.get('period') ?? 'month' // 'day' | 'week' | 'month'

        // Calcular fecha de inicio según el periodo
        const periodMap: Record<string, string> = {
            day: new Date(Date.now() - 86400000).toISOString(),
            week: new Date(Date.now() - 7 * 86400000).toISOString(),
            month: new Date(Date.now() - 30 * 86400000).toISOString(),
        }
        const since = periodMap[period] ?? periodMap.month

        const { data, error } = await supabase
            .from('workspace_usage')
            .select('tokens_used, cost_usd, model_used, created_at')
            .eq('workspace_id', params.id)
            .eq('user_id', user.id)
            .gte('created_at', since)
            .order('created_at', { ascending: false })

        if (error) throw error

        const records = data ?? []

        // Agregar stats
        const totalTokens = records.reduce((sum, r) => sum + (r.tokens_used ?? 0), 0)
        const totalCostUsd = records.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0)

        const modelCount = records.reduce((acc: Record<string, number>, r) => {
            const m = r.model_used as string
            acc[m] = (acc[m] ?? 0) + (r.tokens_used ?? 0)
            return acc
        }, {})

        const topModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'gemini-2.0-flash'

        // Calcular tendencia (últimas 24h vs anteriores)
        const last24h = records.filter(r =>
            new Date(r.created_at as string) > new Date(Date.now() - 86400000)
        )
        const last24hTokens = last24h.reduce((sum, r) => sum + (r.tokens_used ?? 0), 0)

        return NextResponse.json({
            period,
            totalTokens,
            totalCostUsd: parseFloat(totalCostUsd.toFixed(6)),
            topModel,
            last24hTokens,
            recordCount: records.length,
            // Límite estimado del free tier de Gemini Flash:
            // ~15M tokens/día gratis en AI Studio (aproximado)
            freeTierLimit: 1500, // requests/day
            freeTierUsedToday: last24h.length,
            modelBreakdown: modelCount,
        })
    } catch (error) {
        console.error('[GET /api/workspace/[id]/usage]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
