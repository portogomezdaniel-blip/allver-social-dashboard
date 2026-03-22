export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center">
        <h1 className="text-5xl tracking-[0.25em] text-foreground">FTP</h1>
        <p className="text-xs tracking-[0.3em] text-muted-foreground mt-2">
          CREATOR COMMAND SYSTEM
        </p>
        <div className="w-12 h-px bg-primary mx-auto mt-6" />
      </div>
      <p className="text-sm text-muted-foreground tracking-wide">
        Selecciona un modulo del panel lateral.
      </p>
    </div>
  );
}
