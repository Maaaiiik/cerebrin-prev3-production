import { NextResponse } from 'next/server';
import { MirroringService } from '@/services/MirroringService';

export async function POST(req: Request) {
    try {
        const { twin_id } = await req.json();

        if (!twin_id) {
            return NextResponse.json({ error: 'twin_id is required' }, { status: 400 });
        }

        const result = await MirroringService.summarizeLogsToMemory(twin_id);

        return NextResponse.json({
            success: true,
            insights_created: result.count
        });
    } catch (error: any) {
        console.error('[API Mirror] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
