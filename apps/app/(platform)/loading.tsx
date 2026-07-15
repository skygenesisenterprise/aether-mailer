import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformLoading() {
  return (
    <div className="min-h-full">
      <div className="flex h-20 items-center gap-3 border-b border-border/60 px-5 lg:px-7">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64 max-w-[60vw]" />
        </div>
      </div>
      <div className="grid gap-5 p-4 lg:grid-cols-3 lg:p-7">
        <Skeleton className="h-52 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
      </div>
    </div>
  );
}
