import "./globals.css";

export const metadata = {
  title: "Museum of Thought",
  description: "A premium thought-mapping and reflection space."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
