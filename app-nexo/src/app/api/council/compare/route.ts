import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Preparation for parallel calls
        const models = [
            { id: 'claude', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
            { id: 'gpt', provider: 'openai', model: 'gpt-4o' },
            { id: 'gemini', provider: 'google', model: 'gemini-1.5-pro' }
        ];

        // We'll use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled(models.map(async (m) => {
            if (m.provider === 'openai') {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: m.model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.7
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || 'OpenAI Error');
                return { id: m.id, content: data.choices[0].message.content };
            }

            if (m.provider === 'anthropic') {
                const res = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: m.model,
                        max_tokens: 4096,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || 'Anthropic Error');
                return { id: m.id, content: data.content[0].text };
            }

            if (m.provider === 'google') {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m.model}:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || 'Google Error');
                return { id: m.id, content: data.candidates[0].content.parts[0].text };
            }

            throw new Error('Unknown provider');
        }));

        const responses: Record<string, string> = {};
        results.forEach((res) => {
            if (res.status === 'fulfilled') {
                responses[res.value.id] = res.value.content;
            } else {
                console.error(`Model failed:`, res.reason);
                responses[(res as any).id || 'error'] = `Error: ${res.reason.message}`;
            }
        });

        // "The Judge" Synthesis Logic (Simple Mock for now, or we can use ONE of the models to synthesize)
        // Let's use GPT-4o to synthesize if available, otherwise Gemini.
        let judgeContent = "Esperando síntesis de alto mando...";
        const synthesisPrompt = `Actúa como 'El Juez', un estratega ejecutivo de alto nivel.
Analiza estas tres respuestas de diferentes IAs y crea un RESUMEN EJECUTIVO TÁCTICO. 
Dime qué puntos coinciden, qué riesgos hay, y cuál es la MEJOR ACCIÓN A TOMAR.
Sé directo, profesional y autoritario.

RESPUESTAS:
${Object.entries(responses).map(([id, text]) => `--- IA ${id.toUpperCase()} ---\n${text}`).join('\n\n')}
`;

        try {
            // Synthesis Call
            const synthRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: "Eres el Juez Supremo del Consejo de Inteligencia." }, { role: 'user', content: synthesisPrompt }],
                    temperature: 0.5
                })
            });
            const synthData = await synthRes.json();
            if (synthRes.ok) {
                judgeContent = synthData.choices[0].message.content;
            }
        } catch (e) {
            console.error("Judge synthesis failed:", e);
        }

        return NextResponse.json({
            responses,
            judge: judgeContent
        });

    } catch (error: any) {
        console.error("[API/Council/Compare] Global Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
