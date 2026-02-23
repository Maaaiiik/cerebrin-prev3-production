import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { UserService } from '@/services/UserService'

export async function POST(req: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { phone, workspaceId } = await req.json()

        if (!phone) {
            return NextResponse.json({ error: 'Se requiere el número de teléfono' }, { status: 400 })
        }

        if (!workspaceId) {
            return NextResponse.json({ error: 'Se requiere el workspaceId' }, { status: 400 })
        }

        // Normalizar teléfono (quitar espacios, +, etc. si es necesario para OpenClaw)
        const normalizedPhone = phone.replace(/\D/g, '')

        await UserService.updatePerspective(session.user.id, workspaceId, {
            phone: normalizedPhone
        })

        return NextResponse.json({
            success: true,
            message: 'Teléfono vinculado correctamente',
            phone: normalizedPhone
        })

    } catch (error: any) {
        console.error('Error in /api/integrations/telegram/connect:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
