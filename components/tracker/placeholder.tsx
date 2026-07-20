export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto max-w-5xl space-y-2 p-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {note ?? 'Deze module wordt in de volgende bouwronde ingevuld.'}
      </p>
    </div>
  );
}
