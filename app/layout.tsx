import './globals.css';
import Providers from './providers';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Inventory - Kiểm kê thời đại mới',
  description: 'Hệ thống kiểm kê đa công ty: tạo phiếu, import sổ sách, đối soát chênh lệch và quét tồn kho bằng scanner PDA.',
  applicationName: 'Inventory',
  openGraph: {
    title: 'Inventory - Kiểm kê thời đại mới',
    description: 'Tạo phiếu, import sổ sách, đối soát chênh lệch và quét tồn kho bằng scanner PDA.',
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Inventory'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inventory - Kiểm kê thời đại mới',
    description: 'Tạo phiếu, import sổ sách, đối soát chênh lệch và quét tồn kho bằng scanner PDA.'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
