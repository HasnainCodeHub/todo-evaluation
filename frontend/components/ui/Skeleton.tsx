'use client'

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ variant = 'text', width, height, className = '' }: SkeletonProps) {
  const baseStyles = `animate-pulse bg-gradient-to-r from-white/[0.06] via-white/[0.10] to-white/[0.06] bg-[length:200%_100%]`
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  }
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} style={style} />
}

export function TaskSkeleton() {
  return (
    <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={24} height={24} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
      </div>
    </div>
  )
}

export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="relative p-6 bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/10 to-white/5" />
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton variant="text" width={48} height={28} />
          <Skeleton variant="text" width={64} height={12} />
        </div>
      </div>
    </div>
  )
}
