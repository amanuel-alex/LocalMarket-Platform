import { Suspense } from "react";

import { AdminUsersManagementClient } from "@/components/admin/admin-users-client";
import { Skeleton } from "@/components/ui/skeleton";

function UsersFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<UsersFallback />}>
      <AdminUsersManagementClient />
    </Suspense>
  );
}
