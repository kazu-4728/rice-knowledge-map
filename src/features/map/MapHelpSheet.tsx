"use client";

import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "../../components/ui/drawer";
import { ScreenSequence } from "../home/ScreenSequence";
import { FlowGuide } from "../flow/FlowGuide";
import { defaultImage } from "../../lib/data/defaultImageCatalog";
import { IconClose } from "../../components/ui/icons";

/** マップの色の意味（凡例） */
const LEGEND = [
  { color: "bg-emerald-500", label: "緑 = 順調", desc: "特に気になることはない田んぼ" },
  { color: "bg-amber-400", label: "黄 = 要確認", desc: "次の見回りで見ておきたい田んぼ" },
  { color: "bg-red-500", label: "赤 = 異常", desc: "未対応の異常がある田んぼ" },
];

const STEPS = [
  { src: defaultImage("screen-map-overview.webp"), caption: "開くと自分の田んぼが色つきで見える" },
  { src: defaultImage("screen-map-fab.webp"), caption: "右下の＋から記録や田んぼ登録を始める" },
  { src: defaultImage("screen-map-draw.webp"), caption: "指でなぞって新しい田んぼを登録" },
  { src: defaultImage("screen-map-sheet.webp"), caption: "下のシートで今の状態と次の一手を確認" },
];

/**
 * マップの常設ヘルプ（?ボタンから開く）。初回だけでなくいつでも見られる。
 * 実画面のステップ再生で「なぞって登録」「色の意味」「ピン」を説明する。
 */
export default function MapHelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onOpenChange={(next) => { if (!next) onClose(); }} direction="bottom" shouldScaleBackground={false}>
      <DrawerContent
        direction="bottom"
        className="max-h-[85dvh] rounded-t-3xl bg-white p-0 shadow-2xl"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-2">
          <DrawerTitle className="text-base font-bold text-gray-900">マップの使い方</DrawerTitle>
          <DrawerClose
            aria-label="閉じる"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <IconClose className="h-5 w-5" />
          </DrawerClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {/* マップは使い方の流れのステップ1（ここから始める） */}
          <FlowGuide current="map" />
          <ScreenSequence steps={STEPS} className="mt-3" />

          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-900">色の意味</p>
            <ul className="mt-2 space-y-2">
              {LEGEND.map((l) => (
                <li key={l.label} className="flex items-center gap-2.5 text-xs text-gray-600">
                  <span className={`h-3.5 w-3.5 shrink-0 rounded ${l.color}`} />
                  <span className="font-bold text-gray-800">{l.label}</span>
                  <span className="min-w-0">{l.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-900">できること</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-gray-600">
              <li>・右下の＋ボタン: 写真・音声の記録、異常の報告、田んぼの登録</li>
              <li>・田んぼをタップ: その田んぼの状態・記録・ピンを確認</li>
              <li>・ピン: 入水口・出水口・異常箇所などの場所を覚えておける</li>
              <li>・下のシート: 田んぼ全体の状態と「次にやること」を表示</li>
            </ul>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
