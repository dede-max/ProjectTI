import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function getAuthUser(roles = []) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
        return { user: null, error: NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 }) };
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (roles.length > 0 && !roles.includes(decoded.peran)) {
            return { user: null, error: NextResponse.json({ error: 'Terlarang' }, { status: 403 }) };
        }
        return { user: decoded, error: null };
    } catch {
        return { user: null, error: NextResponse.json({ error: 'Token tidak valid' }, { status: 403 }) };
    }
}
