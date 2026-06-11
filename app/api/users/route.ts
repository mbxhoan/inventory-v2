import { NextResponse } from 'next/server';
import { requireUserAdmin } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateUserPayload } from '@/lib/users';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await requireUserAdmin();
    const { data, error } = await supabaseAdmin()
      .from('app_users')
      .select('id, email, full_name, role, user_type, is_active, created_at')
      .eq('company_id', session.company_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ users: data || [] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: status(err) });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUserAdmin();
    const body = await req.json();
    const payload = {
      email: String(body.email || '').trim().toLowerCase(),
      full_name: String(body.full_name || '').trim(),
      role: String(body.role || '').trim(),
      user_type: String(body.user_type || '').trim(),
      pin: String(body.pin || '').trim()
    };
    const invalid = validateUserPayload(payload, true);
    if (invalid) return NextResponse.json({ message: invalid }, { status: 400 });

    const { data, error } = await supabaseAdmin()
      .from('app_users')
      .insert({
        company_id: session.company_id,
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
        user_type: payload.user_type,
        pin: payload.pin,
        is_active: body.is_active ?? true
      })
      .select('id, email, full_name, role, user_type, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ message: 'Email đã tồn tại.' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: status(err) });
  }
}

function status(err: any) {
  if (err.message === 'UNAUTHORIZED') return 401;
  if (err.message === 'FORBIDDEN') return 403;
  return 400;
}
