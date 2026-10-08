import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Rebagging",
};

export default function RebaggingPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Rebagging"
        description="Repack rice between sack sizes"
      />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Rebagging is not available yet.
        </CardContent>
      </Card>
    </div>
  );
}
