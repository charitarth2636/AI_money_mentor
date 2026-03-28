import "./globals.css";
import { ThemeProvider } from "next-themes"; // If using next-themes

export const metadata = {
  title: "Money Mentor",
  description: "AI Finance App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning is necessary when using dark/light theme toggles
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-indigo-500/30">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange // Add this to prevent style flickering
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}