export type UserType = 'WEB' | 'PDA';

export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  user_type: UserType;
  is_active: boolean;
  created_at?: string;
};

// Vai trò hợp lệ theo loại tài khoản.
export const ROLES_BY_TYPE: Record<UserType, { value: string; label: string }[]> = {
  WEB: [
    { value: 'tenant_admin', label: 'Quản trị công ty' },
    { value: 'manager', label: 'Quản lý' },
    { value: 'viewer', label: 'Chỉ xem' }
  ],
  PDA: [{ value: 'operator', label: 'Nhân viên quét PDA' }]
};

export const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'WEB', label: 'Web quản lý' },
  { value: 'PDA', label: 'Scanner PDA' }
];

export const ROLE_LABELS: Record<string, string> = {
  system_admin: 'System Admin',
  tenant_admin: 'Quản trị công ty',
  manager: 'Quản lý',
  viewer: 'Chỉ xem',
  operator: 'Nhân viên PDA'
};

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Kiểm tra payload tạo/sửa user; trả message lỗi đầu tiên hoặc null.
export function validateUserPayload(p: {
  email: string;
  full_name: string;
  user_type: string;
  role: string;
  pin?: string;
}, requirePin: boolean): string | null {
  if (!p.full_name?.trim()) return 'Bắt buộc nhập họ tên.';
  if (!isValidEmail(p.email || '')) return 'Email không hợp lệ.';
  if (p.user_type !== 'WEB' && p.user_type !== 'PDA') return 'Loại tài khoản không hợp lệ.';
  const roles = ROLES_BY_TYPE[p.user_type as UserType].map((r) => r.value);
  if (!roles.includes(p.role)) return 'Vai trò không phù hợp với loại tài khoản.';
  if (requirePin || (p.pin && p.pin.length > 0)) {
    if (!p.pin || p.pin.trim().length < 4) return 'Mã PIN tối thiểu 4 ký tự.';
  }
  return null;
}
