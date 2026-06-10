import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { setSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json();
  const email = String(body.email || '').trim();
  const pin = String(body.pin || '').trim();

  if (!email || !pin) {
    return NextResponse.json({ message: 'Vui lòng nhập email và mã PIN.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .rpc('login_app_user', { p_email: email, p_pin: pin })
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ message: 'Thông tin đăng nhập không đúng.' }, { status: 401 });
  }

  if ((data as any).user_type === 'PDA') {
    return NextResponse.json({ message: 'Tài khoản PDA vui lòng đăng nhập ở app Scanner.' }, { status: 403 });
  }

  await setSession(data as any);
  return NextResponse.json({ user: data });
}
