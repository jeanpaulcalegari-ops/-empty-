export function Loading() {
  return <div className="py-20 text-center text-sm text-muted">Loading…</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="card border-danger/40 p-6 text-sm text-danger">{message}</div>;
}
