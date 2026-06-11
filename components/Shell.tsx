'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Building2, ClipboardList, Home, LogOut, Users } from 'lucide-react';

const USER_ADMIN_ROLES = ['system_admin', 'tenant_admin'];

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/stores', label: 'Cửa hàng & vị trí', icon: Building2 },
  { href: '/tickets', label: 'Phiếu kiểm kê', icon: ClipboardList },
  { href: '/users', label: 'Người dùng', icon: Users, adminOnly: true },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 }
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);

  const visible = items.filter((item) => !item.adminOnly || (role !== null && USER_ADMIN_ROLES.includes(role)));

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          Inventory
          <span>Kiểm kê thời đại mới</span>
        </div>
        <nav className="nav">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? 'active' : ''}>
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
          <button onClick={logout}><LogOut size={18} /> Đăng xuất</button>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
