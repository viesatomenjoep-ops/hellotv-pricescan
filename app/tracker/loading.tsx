// Instant laadskelet voor alle Tracker-pagina's — navigatie voelt direct (streaming).
export default function TrackerLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6" aria-busy="true" aria-label="Laden…">
      <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
