"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Something went wrong
        </CardTitle>
        <CardDescription>
          We could not load this page. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={reset} className="w-full">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
