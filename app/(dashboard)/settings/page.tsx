import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Company, POS, and inventory preferences"
      />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Settings are not available yet.
        </CardContent>
      </Card>
    </div>
  );
}
