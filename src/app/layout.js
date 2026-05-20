import "./globals.css";

export const metadata = {
  title: "Spotify Tracks Intelligence Dashboard",
  description:
    "Dashboard interactivo de ciencia de datos para analizar tracks, géneros y características musicales de Spotify.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}