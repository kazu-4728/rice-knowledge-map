import { Suspense } from "react";
import AppShell from "../../../components/layout/AppShell";
import FieldDetailScreen from "../../../features/fields/FieldDetailScreen";

type Props = { params: Promise<{ id: string }> };

export default async function FieldDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell backHref="/map" backLabel="マップ">
      <Suspense fallback={null}>
        <FieldDetailScreen fieldId={decodeURIComponent(id)} />
      </Suspense>
    </AppShell>
  );
}
