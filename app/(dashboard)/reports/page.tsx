import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        description="Operational reports and daily summaries"
      />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Reports are not available yet.
        </CardContent>
      </Card>
    </div>
  );
}
