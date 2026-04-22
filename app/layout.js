import "./globals.css";

export const metadata = {
  title: "Museum of Thought",
  description: "Interactive thought space"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
