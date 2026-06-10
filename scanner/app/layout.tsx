import './globals.css';
import RegisterSW from './register-sw';

export const metadata = {
  title: 'Inventory Scanner',
  description: 'Scanner PWA cho Inventory - Kiểm kê thời đại mới',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body><RegisterSW />{children}</body></html>;
}
