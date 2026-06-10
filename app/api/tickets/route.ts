import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const session = await requireSession(['ADMIN','WEB']);
    const { data, error } = await supabaseAdmin()
      .from('tickets')
      .select('*, stores(name, code), slots(name, code), v_ticket_stats(total_items,total_ori_qty,total_real_qty,total_diff_qty,discrepancy_items,pending_sync_batches)')
      .eq('company_id', session.company_id)
      .neq('status', 'DELETED')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ tickets: data || [] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession(['WEB']);
    const body = await req.json();
    const hasBookData = Boolean(body.has_book_data ?? true);
    const { data, error } = await supabaseAdmin().from('tickets').insert({
      company_id: session.company_id,
      store_id: body.store_id,
      slot_id: body.slot_id || null,
      code: String(body.code || `KK-${Date.now()}`).trim(),
      name: String(body.name || 'Phiếu kiểm kê mới').trim(),
      inventory_date: body.inventory_date || new Date().toISOString().slice(0, 10),
      has_book_data: hasBookData,
      status: hasBookData ? 'NEW' : 'APPROVED',
      note: body.note || null,
      created_by: session.id
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ ticket: data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 400 });
  }
}
