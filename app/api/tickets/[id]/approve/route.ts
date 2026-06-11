import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Ctx) {
  try {
    const session = await requireSession(['WEB']);
    const { id } = await params;
    const { data, error } = await supabaseAdmin().rpc('rpc_approve_ticket', {
      p_actor_user_id: session.id,
      p_ticket_id: id
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
