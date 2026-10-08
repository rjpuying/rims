import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DeactivatedNotice } from "@/components/auth/deactivated-notice";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginGate />
    </Suspense>
  );
}

async function LoginGate() {
  await connection();
  const activeUser = await getCurrentUser();
  if (activeUser) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return <DeactivatedNotice />;

  return <LoginForm />;
}

function LoginSkeleton() {
  return (
    <Card>
      <CardHeader className="items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}
