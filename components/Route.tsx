export default function Route({ from, to, large }: { from: string; to: string; large?: boolean }) {
  return (
    <div className="flex gap-3 min-w-0">
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-accent" />
        <span className="w-px flex-1 bg-border my-1" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
      </div>
      <div className={`min-w-0 ${large ? "space-y-3 text-xl" : "space-y-1.5"} font-medium`}>
        <div className="truncate">{from}</div>
        <div className="truncate">{to}</div>
      </div>
    </div>
  );
}
