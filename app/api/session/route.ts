import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	const { value } = await req.json();

	const res = NextResponse.json({ success: true });
	res.cookies.set('auth-session', value, { path: '/', maxAge: 31536000 });
	return res;
}
