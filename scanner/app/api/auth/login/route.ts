import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { setSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email || '').trim();
  const pin = String(body.pin || '').trim();

  const { data, error } = await supabaseAdmin()
    .rpc('login_app_user', { p_email: email, p_pin: pin })
    .maybeSingle();

  if (error || !data) return NextResponse.json({ message: 'Đăng nhập không đúng.' }, { status: 401 });
  if ((data as any).user_type !== 'PDA') return NextResponse.json({ message: 'App Scanner chỉ dùng tài khoản PDA.' }, { status: 403 });

  await setSession(data as any);
  return NextResponse.json({ user: data });
}
