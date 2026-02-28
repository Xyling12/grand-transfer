import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
        name: 'driver_session',
        value: '',
        httpOnly: true,
        path: '/',
        maxAge: 0,
    });
    return response;
}
