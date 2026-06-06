import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex border-b bg-slate-50/50 p-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Body */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex p-4 gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={`cell-${i}-${j}`}
                className={`h-4 ${
                  j === 0 ? "w-[30%]" : j === cols - 1 ? "w-[15%]" : "flex-1"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
