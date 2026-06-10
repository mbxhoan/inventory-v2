import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const session = await requireSession(['ADMIN','WEB']);
    const db = supabaseAdmin();
    const companyId = session.company_id;

    if (!companyId && session.user_type === 'ADMIN') {
      const { count: companies } = await db.from('companies').select('*', { count: 'exact', head: true });
      return NextResponse.json({ mode: 'admin', companies: companies || 0, tickets: 0, items: 0, scans: 0, statuses: [] });
    }

    const [ticketRes, itemRes, scanRes, statsRes] = await Promise.all([
      db.from('tickets').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      db.from('inventories').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      db.from('inventory_details').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      db.from('tickets').select('status').eq('company_id', companyId)
    ]);

    const statuses = (statsRes.data || []).reduce<Record<string, number>>((acc, row: any) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      mode: 'tenant',
      user: session,
      tickets: ticketRes.count || 0,
      items: itemRes.count || 0,
      scans: scanRes.count || 0,
      statuses: Object.entries(statuses).map(([status, count]) => ({ status, count }))
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: err.message === 'UNAUTHORIZED' ? 401 : 500 });
  }
}
