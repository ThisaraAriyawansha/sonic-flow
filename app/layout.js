import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const description = "Play your music, shape bass and treble, and download tracks with your EQ applied";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "SonicFlow",
  description,
  appleWebApp: { capable: true, title: "SonicFlow", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: "SonicFlow",
    title: "SonicFlow",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "SonicFlow",
    description,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Applies the saved theme before first paint so there is no light/dark flash.
const themeScript = `try{var t=localStorage.getItem("sonicflow-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
