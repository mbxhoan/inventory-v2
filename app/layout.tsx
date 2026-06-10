import './globals.css';

export const metadata = {
  title: 'Inventory - Kiểm kê thời đại mới',
  description: 'SaaS kiểm kê đa công ty với scanner PWA'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
