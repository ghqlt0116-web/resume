import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "SK브로드밴드 'B tv 신규 서비스' 기자설명회 참가 신청",
  description: "SK브로드밴드 신규 서비스 기자 설명회 참석 신청 페이지입니다.",
  openGraph: {
    title: "SK브로드밴드 'B tv 신규 서비스' 기자설명회 참가 신청",
    description: "SK브로드밴드 신규 서비스 기자 설명회 참석 신청 페이지입니다.",
    siteName: "SK브로드밴드",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
