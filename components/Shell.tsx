'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Building2, ClipboardList, Home, LogOut } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/stores', label: 'Cửa hàng & vị trí', icon: Building2 },
  { href: '/tickets', label: 'Phiếu kiểm kê', icon: ClipboardList },
  { href: '/reports', label: 'Báo cáo', icon: BarChart3 }
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
          {items.map((item) => {
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
