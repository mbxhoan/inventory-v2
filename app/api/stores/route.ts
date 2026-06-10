import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const session = await requireSession(['ADMIN','WEB']);
    const db = supabaseAdmin();
    const { data, error } = await db
      .from('stores')
      .select('*, slots(*)')
      .eq('company_id', session.company_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ stores: data || [] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession(['WEB']);
    const body = await req.json();
    const db = supabaseAdmin();
    const { data, error } = await db.from('stores').insert({
      company_id: session.company_id,
      code: String(body.code || '').trim(),
      name: String(body.name || '').trim(),
      address: body.address || null
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ store: data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
