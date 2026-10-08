import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function NoPermissionCard({ message }: { message?: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <ShieldAlert className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">
          {message ?? "You do not have permission to view this page."}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Contact the administrator if you believe this is a mistake.
        </p>
      </CardContent>
    </Card>
  );
}
