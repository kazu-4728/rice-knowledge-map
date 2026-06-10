import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import { fields } from "../../data/dummy";
import { PaddyPhoto } from "../../components/ui/PaddyPhoto";
import { IconChevronRight, IconFieldGrid, IconPlus, IconSprout } from "../../components/ui/icons";

const fieldColor: Record<string, string> = {
  blue: "#3B82F6",
  yellow: "#EAB308",
  green: "#22C55E",
  purple: "#A855F7",
};

export default function FieldsPage() {
  return (
    <AppShell>
      <div className="space-y-3 px-3 pb-6 pt-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <IconFieldGrid className="h-6 w-6 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-900">田んぼ一覧</h1>
          </div>
          <span className="text-sm text-gray-500">{fields.length}枚</span>
        </div>

        <div className="space-y-2.5">
          {fields.map((field) => (
            <Link
              key={field.id}
              href="/map"
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                <PaddyPhoto variant="field" className="h-full w-full" />
                <span
                  className="absolute inset-0 opacity-45"
                  style={{ background: fieldColor[field.color] }}
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 text-xs font-bold text-gray-900 shadow">
                  {field.label}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-gray-900">
                  {field.name}
                  <span className="ml-2 text-sm font-medium text-gray-500">{field.area}</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                  <IconSprout className="h-4 w-4 text-green-600" />
                  {field.crop}
                  <span className="rounded bg-green-50 px-1.5 py-0.5 font-semibold text-green-700">
                    {field.season}
                  </span>
                </p>
              </div>
              <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
            </Link>
          ))}
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-600 bg-white py-4 text-sm font-bold text-green-700 transition-colors hover:bg-green-50">
          <IconPlus className="h-5 w-5" strokeWidth={2.2} />
          田んぼを追加（マップで描く）
        </button>
      </div>
    </AppShell>
  );
}
