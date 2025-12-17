
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Linear uses Inter
import "./globals.css";
import { Toaster } from "sonner"; // Assuming sonner is used for toasts (lighter, better design)

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SMS | Linear Style",
  description: "Advanced School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* Default to dark mode as per 'Linear style' preference */}
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
