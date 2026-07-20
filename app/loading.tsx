// Root-laadskelet (PriceScan-pagina's) — directe feedback bij navigatie.
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6" aria-busy="true" aria-label="Laden…">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
