import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hyperliquid Live Charts",
  description:
    "Real-time trading charts for BTC, ETH, SOL, and AVAX on Hyperliquid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent wallet extension injection errors
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('JSON-RPC')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                });
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && e.reason.message.includes('JSON-RPC')) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          overflow: "hidden",
          width: "100vw",
          height: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
