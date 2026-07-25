import AppShell from "../../../components/layout/AppShell";
import FamilyMembersScreen from "../../../features/members/FamilyMembersScreen";

export default function FamilyPage() {
  return (
    <AppShell backHref="/menu" backLabel="メニュー">
      <FamilyMembersScreen />
    </AppShell>
  );
}
