import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BalanceReportSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
        <div className="space-y-2 mb-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Date Range Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-2 border-transparent bg-white/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="ml-8">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-2 border-transparent bg-white/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-40" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-6 w-6 mb-2 hidden sm:block rounded-full" />
                <div className="flex-1 w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-5">
        {/* Orders */}
        <SectionSkeleton borderClass="border-blue-500/50" />

        {/* Purchases */}
        <SectionSkeleton borderClass="border-purple-500/50" hasTable />

        {/* Delivery */}
        <SectionSkeleton borderClass="border-green-500/50" hasTable />

        {/* Costs */}
        <SectionSkeleton borderClass="border-orange-500/50" />

        {/* Expenses */}
        <SectionSkeleton borderClass="border-red-500/50" cols={3} />

        {/* Executive Summary */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionSkeleton({
  borderClass,
  hasTable = false,
  cols = 5,
}: {
  borderClass: string;
  hasTable?: boolean;
  cols?: number;
}) {
  return (
    <Card className={`border-l-4 ${borderClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-60" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-3`}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        {hasTable && (
          <div className="border-t pt-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
