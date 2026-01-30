import "./globals.css";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./(app)/providers";

export const metadata = {
  title: "CommPutation",
  description: "Seamlessly create on-chain communities, manage projects, and reward contributions with transparent token-based systems.",
};

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="font-sans">
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
