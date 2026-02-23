import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { runMultimodalTask } from '@/lib/gemini'

export async function POST(req: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { files } = await req.json()

        if (!files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'Se requiere al menos un archivo (base64)' }, { status: 400 })
        }

        const prompt = `Analiza estas imágenes/PDFs de una malla curricular o un horario de clases.
Extrae la información y devuélvela estrictamente en formato JSON:
{
  "classes": [
    {
      "name": "Nombre de la asignatura",
      "code": "Código (si existe)",
      "schedule": [
        { "day": "Lunes/Martes...", "start": "HH:MM", "end": "HH:MM" }
      ],
      "professor": "Nombre (si existe)"
    }
  ],
  "summary": "Resumen de la carga académica"
}`

        const response = await runMultimodalTask(prompt, files)

        // Tentar parsear el JSON de la respuesta de IA
        try {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const structuredData = JSON.parse(jsonMatch[0])
                return NextResponse.json({ data: structuredData, tokensUsed: response.tokensUsed })
            }
        } catch (e) {
            console.error('Error parsing Gemini JSON:', e)
        }

        return NextResponse.json({
            rawText: response.text,
            tokensUsed: response.tokensUsed,
            message: 'No se pudo estructurar el JSON automáticamente, se devuelve texto plano.'
        })

    } catch (error: any) {
        console.error('Error in /api/student/parse-schedule:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
