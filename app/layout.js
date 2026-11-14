import "./globals.css";

export const metadata = {
  title: "Music Player",
  description: "Upload MP3 files and control bass and treble",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
