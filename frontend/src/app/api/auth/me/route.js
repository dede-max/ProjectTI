import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';

export async function GET() {
    const { user, error } = await getAuthUser();
    if (error) return error;
    return NextResponse.json({ pengguna: user });
}
