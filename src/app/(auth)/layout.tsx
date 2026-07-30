export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">EvTick</h1>
        <p className="text-sm text-muted-foreground">IT Talep ve Takip Sistemi</p>
      </div>
      {children}
    </div>
  );
}
