export function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none dark:hidden">
      <div className="absolute top-1/2 left-1/2 h-[200vh] w-[200vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-accent/20 to-background/30 opacity-40 blur-3xl animate-aurora motion-reduce:hidden"></div>
    </div>
  );
}
