export function TodaySection({
  title,
  count,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  emptyText: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {count > 0 && (
          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="px-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        children
      )}
    </section>
  );
}
