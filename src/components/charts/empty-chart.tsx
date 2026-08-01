export function EmptyChart({ message, minHeight = 200 }: { message: string; minHeight?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-[13px] font-medium text-muted"
      style={{ minHeight }}
    >
      {message}
    </div>
  );
}
