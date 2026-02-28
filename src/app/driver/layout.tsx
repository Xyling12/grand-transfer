import type { Metadata, Viewport } from 'next';
import './driver.css';

export const metadata: Metadata = {
    title: 'GrandTransfer — Кабинет водителя',
    description: 'Мобильное приложение для водителей и диспетчеров GrandTransfer',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'GrandTransfer',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#0a0a1a',
};

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="driver-app">
            {children}
        </div>
    );
}
