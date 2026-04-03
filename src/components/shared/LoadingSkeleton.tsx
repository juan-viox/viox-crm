export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 rounded ${width} animate-shimmer`} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <SkeletonLine width="w-1/3" />
      <SkeletonLine width="w-full" />
      <SkeletonLine width="w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 space-y-4">
        <SkeletonLine width="w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <SkeletonLine width="w-1/4" />
          <SkeletonLine width="w-1/3" />
          <SkeletonLine width="w-1/6" />
          <SkeletonLine width="w-1/6" />
        </div>
      ))}
    </div>
  )
}

export default function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'table' | 'line' }) {
  if (type === 'table') return <SkeletonTable />
  if (type === 'line') return <SkeletonLine />
  return <SkeletonCard />
}
