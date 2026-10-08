"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function DeactivatedNotice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Account deactivated</CardTitle>
        <CardDescription>
          Your account has been deactivated. Contact the administrator to
          regain access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
          disabled={loading}
        >
          {loading ? "Signing out…" : "Sign out"}
        </Button>
      </CardContent>
    </Card>
  );
}
