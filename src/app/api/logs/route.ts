import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Basic security check, only allow if secret matches
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== 'log123') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const output = execSync('pm2 logs bot --lines 100 --nostream', { encoding: 'utf-8' });
        return new NextResponse(output, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stdout: e.stdout?.toString(), stderr: e.stderr?.toString() }, { status: 500 });
    }
}
