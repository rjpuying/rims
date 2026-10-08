import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Users & Roles",
};

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Users & Roles"
        description="Manage staff accounts and permissions"
      />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          User management is not available yet.
        </CardContent>
      </Card>
    </div>
  );
}
