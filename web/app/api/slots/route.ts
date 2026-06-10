import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const session = await requireSession(['WEB']);
    const body = await req.json();
    const db = supabaseAdmin();
    const { data: store } = await db.from('stores').select('id').eq('id', body.store_id).eq('company_id', session.company_id).single();
    if (!store) return NextResponse.json({ message: 'Không tìm thấy cửa hàng.' }, { status: 404 });

    const { data, error } = await db.from('slots').insert({
      company_id: session.company_id,
      store_id: body.store_id,
      code: String(body.code || '').trim(),
      name: String(body.name || '').trim()
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ slot: data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
