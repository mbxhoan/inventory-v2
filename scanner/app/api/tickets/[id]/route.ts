import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Ctx = { params: { id: string } };
export async function GET(_: Request, { params }: Ctx) {
  try {
    const session = await requireSession(['PDA']);
    const db = supabaseAdmin();
    const [ticketRes, invRes] = await Promise.all([
      db.from('tickets').select('*, stores(name,code), slots(name,code)').eq('id', params.id).eq('company_id', session.company_id).in('status', ['APPROVED','INPROCESS']).single(),
      db.from('inventories').select('barcode, product_name, ori_qty, real_qty').eq('ticket_id', params.id).eq('company_id', session.company_id).limit(1000)
    ]);
    if (ticketRes.error) throw ticketRes.error;
    return NextResponse.json({ ticket: ticketRes.data, inventories: invRes.data || [] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 404 });
  }
}
