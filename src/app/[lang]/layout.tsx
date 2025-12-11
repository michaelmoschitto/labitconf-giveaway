import { SpeedInsights } from "@vercel/speed-insights/next";

import { getDictionary, type Locale } from "@/lib/dictionaries";

import type { Metadata } from "next";
import "@/app/globals.css";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "es" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const validLang = lang === "en" || lang === "es" ? (lang as Locale) : "es";
  const dict = await getDictionary(validLang);

  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }

    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    if (process.env.URL) {
      return process.env.URL;
    }

    // Fallback to production URL for Twitter/social cards (Twitter requires absolute URLs)
    return "https://labitconf.mezo.org";
  };

  const baseUrl = getBaseUrl();
  const socialImageUrl = `${baseUrl}/LaBitCONF-metada-image.jpeg`;
  const twitterImageUrl = `${socialImageUrl}?v=${Date.now()}`;

  return {
    metadataBase: new URL(baseUrl),
    title: `Mezo: ${dict.giveaway.title}`,
    description: dict.giveaway.description,
    openGraph: {
      title: `Mezo: ${dict.giveaway.title}`,
      description: dict.giveaway.description,
      url: baseUrl,
      siteName: "Mezo",
      locale: validLang === "es" ? "es_ES" : "en_US",
      type: "website",
      images: [
        {
          url: socialImageUrl,
          width: 1280,
          height: 720,
          alt: dict.giveaway.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@MezoNetwork",
      creator: "@MezoNetwork",
      title: `Mezo: ${dict.giveaway.title}`,
      description: dict.giveaway.description,
      images: [twitterImageUrl],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const validLang = lang === "en" || lang === "es" ? (lang as Locale) : "es";

  return (
    <html lang={validLang}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
