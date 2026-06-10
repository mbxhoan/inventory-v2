import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const session = await requireSession(['PDA']);
    const body = await req.json();
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!body.ticket_id || rows.length === 0) return NextResponse.json({ message: 'Không có dữ liệu để đồng bộ.' }, { status: 400 });

    const { data, error } = await supabaseAdmin().rpc('rpc_pda_sync', {
      p_user_id: session.id,
      p_ticket_id: body.ticket_id,
      p_rows: rows
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
