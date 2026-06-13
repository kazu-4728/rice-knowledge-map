import AppShell from "../../../components/layout/AppShell";
import PhotoRecordScreen from "../../../features/records/PhotoRecordScreen";
import AudioRecordScreen from "../../../features/records/AudioRecordScreen";

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function NewRecordPage({ searchParams }: Props) {
  const params = await searchParams;
  const isAudio = params.type === "audio";

  return (
    <AppShell backDynamic backLabel="記録一覧">
      {isAudio ? <AudioRecordScreen /> : <PhotoRecordScreen />}
    </AppShell>
  );
}
