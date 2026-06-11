import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const session = await requireSession(['WEB']);
    const { id } = await params;
    const body = await req.json();
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const { data, error } = await supabaseAdmin().rpc('rpc_import_inventory', {
      p_actor_user_id: session.id,
      p_ticket_id: id,
      p_rows: rows
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
