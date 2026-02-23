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
  metadataBase: new URL('https://www.xn--c1adbj4b9a7c.com'),
  title: "Междугороднее такси | GrandTransfer",
  description: "Межгородское такси по всей России и СНГ. Комфорт и безопасность — наш стандарт. Закажите трансфер до границы (КПП) или в другой город.",
  keywords: "междугороднее такси, такси межгород, заказ такси, комфорт, минивэн, такси граница кпп, трезвый водитель",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://www.xn--c1adbj4b9a7c.com",
    siteName: "GrandTransfer",
    title: "Такси Межгород | GrandTransfer",
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
  verification: {
    google: "6jdi0lGUwUYQl-a_LsZFZYz8709GNp18Zed3SohrgvQ",
    yandex: "4a87d70a322542ad"
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
