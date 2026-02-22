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
  title: "GrandTransfer – Такси межгород",
  description: "Межгородское такси, где комфорт и безопасность — не опция, а стандарт.",
  keywords: "междугороднее такси, такси межгород, заказ такси, комфорт, минивэн, доставка, трезвый водитель",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://xn--c1acbe2apap.com",
    siteName: "GrandTransfer",
    title: "Такси межгород | GrandTransfer",
    description: "Надежные междугородние поездки с фиксированной ценой. Закажите комфортный трансфер прямо сейчас.",
    images: [{
      url: "/images/og-image.jpg", // TODO: create an actual image later if needed
      width: 1200,
      height: 630,
      alt: "GrandTransfer"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Такси межгород | GrandTransfer",
    description: "Мгновенный расчет стоимости и комфортные поездки по межгороду."
  },
  verification: {
    google: "6jdi0lGUwUYQl-a_LsZFZYz8709GNp18Zed3SohrgvQ",
    yandex: "4e0bfdb177542ed"
  }
};

import YandexMetrika from "@/components/YandexMetrika";

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
        <CityProvider>
          <ScrollAnimation />
          {children}
        </CityProvider>
      </body>
    </html>
  );
}
