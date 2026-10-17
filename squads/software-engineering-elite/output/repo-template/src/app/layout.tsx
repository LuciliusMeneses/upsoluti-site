export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="flex">
        <nav className="w-64 bg-gray-100 h-screen p-4">
          <ul className="space-y-2">
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/contacts">Contactos</a></li>
          </ul>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
