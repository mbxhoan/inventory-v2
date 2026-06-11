'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Building2, ClipboardList, Home, LogOut, Menu, Users, X } from 'lucide-react';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => setRole(d.user?.role ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const visible = items.filter((item) => !item.adminOnly || (role !== null && USER_ADMIN_ROLES.includes(role)));

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  function renderNav(closeAfterClick = false) {
    return (
      <nav className="nav">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
              onClick={closeAfterClick ? () => setMobileOpen(false) : undefined}
            >
              <Icon size={18} />
              <span className="nav-item-label">{item.label}</span>
            </Link>
          );
        })}
        <button type="button" className="nav-item" onClick={logout}>
          <LogOut size={18} />
          <span className="nav-item-label">Đăng xuất</span>
        </button>
      </nav>
    );
  }

  return (
    <div className="shell">
      <div className="shell-frame">
        <header className="mobile-topbar">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
          </button>
          <Link href="/dashboard" className="brand-link">
            <Image src="/logo.png" alt="Inventory" className="brand-mark" width={40} height={40} />
            <span className="brand-copy">
              <span className="brand-title">Inventory</span>
              <span className="brand-subtitle">Kiểm kê thời đại mới</span>
            </span>
          </Link>
        </header>

        <aside className="sidebar">
          <div className="sidebar-inner">
            <Link href="/dashboard" className="brand-link">
              <Image src="/logo.png" alt="Inventory" className="brand-mark" width={40} height={40} />
              <span className="brand-copy">
                <span className="brand-title">Inventory</span>
                <span className="brand-subtitle">Kiểm kê thời đại mới</span>
              </span>
            </Link>
            {renderNav()}
          </div>
        </aside>

        <div className={`drawer-root ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}>
          <div className="drawer-backdrop" onClick={() => setMobileOpen(false)} />
          <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
            <div className="drawer-head">
              <Link href="/dashboard" className="brand-link" onClick={() => setMobileOpen(false)}>
                <Image src="/logo.png" alt="Inventory" className="brand-mark" width={40} height={40} />
                <span className="brand-copy">
                  <span className="brand-title">Inventory</span>
                  <span className="brand-subtitle">Kiểm kê thời đại mới</span>
                </span>
              </Link>
              <button type="button" className="drawer-x" onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
                <X size={18} />
              </button>
            </div>
            <div className="drawer-body">{renderNav(true)}</div>
          </aside>
        </div>

        <main className="main">
          <div className="main-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
