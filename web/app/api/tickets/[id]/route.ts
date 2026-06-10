import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const session = await requireSession(['ADMIN','WEB']);
    const db = supabaseAdmin();
    const id = params.id;

    const [ticketRes, inventoryRes, detailRes, syncRes, statsRes] = await Promise.all([
      db.from('tickets').select('*, stores(name,code), slots(name,code)').eq('id', id).eq('company_id', session.company_id).single(),
      db.from('inventories').select('*').eq('ticket_id', id).eq('company_id', session.company_id).order('created_at', { ascending: true }).limit(500),
      db.from('inventory_details').select('*').eq('ticket_id', id).eq('company_id', session.company_id).order('scan_time', { ascending: false }).limit(100),
      db.from('pda_syncs').select('*').eq('ticket_id', id).eq('company_id', session.company_id).order('created_at', { ascending: false }).limit(20),
      db.from('v_ticket_stats').select('*').eq('ticket_id', id).eq('company_id', session.company_id).maybeSingle()
    ]);

    if (ticketRes.error) throw ticketRes.error;
    return NextResponse.json({
      ticket: ticketRes.data,
      inventories: inventoryRes.data || [],
      details: detailRes.data || [],
      syncs: syncRes.data || [],
      stats: statsRes.data
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const session = await requireSession(['WEB']);
    const body = await req.json();
    const allowed: Record<string, any> = {};
    for (const key of ['name','note']) if (key in body) allowed[key] = body[key];
    const { data, error } = await supabaseAdmin()
      .from('tickets')
      .update(allowed)
      .eq('id', params.id)
      .eq('company_id', session.company_id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ticket: data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
