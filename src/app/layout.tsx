import type { Metadata } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";
import { CityProvider } from "@/context/CityContext";
import ScrollAnimation from "@/components/ScrollAnimation";
import SchemaOrg from "@/components/SchemaOrg";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://xn--c1acbe2apap.com'),
  title: "Такси Межгород по России — фиксированная цена | GrandTransfer",
  description: "Межгородское такси по всей России и СНГ. Комфорт и безопасность — наш стандарт. Закажите трансфер до границы (КПП) или в другой город.",
  keywords: "такси межгород, междугороднее такси, заказ такси межгород, трансфер между городами, такси граница кпп, минивэн межгород",
  alternates: {
    canonical: 'https://xn--c1acbe2apap.com',
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://xn--c1acbe2apap.com",
    siteName: "GrandTransfer",
    title: "Такси Межгород | GrandTransfer — междугородние перевозки",
    description: "Надежные междугородние поездки с фиксированной ценой до любого города или границы. Закажите комфортный трансфер прямо сейчас.",
    images: [{
      url: "/images/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "Междугороднее такси GrandTransfer"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Такси Межгород | GrandTransfer",
    description: "Мгновенный расчет стоимости и комфортные поездки по межгороду."
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  },
  verification: {
    google: "6jdi0lGUwUYQl-a_LsZFZYz8709GNp18Zed3SohrgvQ",
    yandex: "4a87d70a322542ad"
  }
};

import YandexMetrika from "@/components/YandexMetrika";
import CookieBanner from "@/components/CookieBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${bodoni.variable} ${jost.variable} `}>
        <SchemaOrg />
        <YandexMetrika />
        <CookieBanner />
        <CityProvider>
          <ScrollAnimation />
          {children}
        </CityProvider>
      </body>
    </html>
  );
}
