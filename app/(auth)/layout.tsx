export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          BE
        </div>
        <p className="text-base font-semibold">Brick Eight Trading Inc.</p>
        <p className="text-sm text-muted-foreground">
          Rice POS &amp; Inventory Management
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
