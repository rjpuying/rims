import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Customer Credits",
};

export default function CreditsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Customer Credits"
        description="Track balances and record payments"
      />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Customer credits are not available yet.
        </CardContent>
      </Card>
    </div>
  );
}
