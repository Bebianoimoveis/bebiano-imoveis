import { Skeleton } from "@/components/ui/skeleton"

export default function PropertiesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[20px]" />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[20px]" />
        ))}
      </div>
    </div>
  )
}
