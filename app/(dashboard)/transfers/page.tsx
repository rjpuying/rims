import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Transfer to Reseller",
};

export default function TransfersPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Transfer to Reseller"
        description="Send stock from My Warehouse to resellers"
      />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Reseller transfers are not available yet.
        </CardContent>
      </Card>
    </div>
  );
}
