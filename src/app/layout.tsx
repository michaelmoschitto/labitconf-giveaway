import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LabitConf Giveaway",
  description: "Win amazing prizes at LabitConf!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
