import AppShell from "../../../components/layout/AppShell";
import FieldDetailScreen from "../../../features/fields/FieldDetailScreen";

type Props = { params: Promise<{ id: string }> };

export default async function FieldDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell backHref="/home" backLabel="田んぼ一覧">
      <FieldDetailScreen fieldId={decodeURIComponent(id)} />
    </AppShell>
  );
}
