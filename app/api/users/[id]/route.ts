import { NextResponse } from 'next/server';
import { requireUserAdmin } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateUserPayload } from '@/lib/users';

export const runtime = 'nodejs';

function status(err: any) {
  if (err.message === 'UNAUTHORIZED') return 401;
  if (err.message === 'FORBIDDEN') return 403;
  return 400;
}

// Đảm bảo user thuộc đúng company của admin đang thao tác.
async function loadOwned(db: ReturnType<typeof supabaseAdmin>, id: string, companyId: string | null) {
  const { data } = await db.from('app_users').select('id, company_id').eq('id', id).single();
  if (!data || data.company_id !== companyId) return null;
  return data;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUserAdmin();
    const { id } = await params;
    const db = supabaseAdmin();

    const owned = await loadOwned(db, id, session.company_id);
    if (!owned) return NextResponse.json({ message: 'Không tìm thấy người dùng.' }, { status: 404 });

    const body = await req.json();
    const update: Record<string, any> = {};

    // Toggle hoạt động (soft delete) — chặn admin tự vô hiệu hóa chính mình.
    if (typeof body.is_active === 'boolean') {
      if (id === session.id && body.is_active === false) {
        return NextResponse.json({ message: 'Không thể vô hiệu hóa tài khoản của chính bạn.' }, { status: 400 });
      }
      update.is_active = body.is_active;
    }

    // Cập nhật thông tin hồ sơ.
    if (body.full_name !== undefined || body.email !== undefined || body.role !== undefined || body.user_type !== undefined || body.pin) {
      const payload = {
        email: String(body.email || '').trim().toLowerCase(),
        full_name: String(body.full_name || '').trim(),
        role: String(body.role || '').trim(),
        user_type: String(body.user_type || '').trim(),
        pin: body.pin ? String(body.pin).trim() : ''
      };
      const invalid = validateUserPayload(payload, false);
      if (invalid) return NextResponse.json({ message: invalid }, { status: 400 });
      update.email = payload.email;
      update.full_name = payload.full_name;
      update.role = payload.role;
      update.user_type = payload.user_type;
      if (payload.pin) update.pin = payload.pin;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ message: 'Không có thay đổi.' }, { status: 400 });
    }
    update.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from('app_users')
      .update(update)
      .eq('id', id)
      .eq('company_id', session.company_id)
      .select('id, email, full_name, role, user_type, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ message: 'Email đã tồn tại.' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ user: data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: status(err) });
  }
}

// Soft delete: vô hiệu hóa thay vì xóa cứng (giữ lịch sử kiểm kê).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUserAdmin();
    const { id } = await params;
    if (id === session.id) {
      return NextResponse.json({ message: 'Không thể xóa tài khoản của chính bạn.' }, { status: 400 });
    }
    const db = supabaseAdmin();
    const owned = await loadOwned(db, id, session.company_id);
    if (!owned) return NextResponse.json({ message: 'Không tìm thấy người dùng.' }, { status: 404 });

    const { error } = await db
      .from('app_users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', session.company_id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: status(err) });
  }
}
