import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const session = await requireSession(['PDA']);
    const { data, error } = await supabaseAdmin()
      .from('tickets')
      .select('id, code, name, status, inventory_date, stores(name,code), slots(name,code), v_ticket_stats(total_items,total_real_qty,total_ori_qty)')
      .eq('company_id', session.company_id)
      .in('status', ['APPROVED','INPROCESS'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ tickets: data || [] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 401 });
  }
}
