import BottomNav from "../../components/layout/BottomNav";
import MapClientWrapper from "../../features/map/MapClientWrapper";

export default function MapPage() {
  return (
    <div className="max-w-md mx-auto relative" style={{ height: "100dvh" }}>
      {/* マップ：BottomNav 分を引いた高さ */}
      <div style={{ position: "absolute", inset: 0, bottom: "56px" }}>
        <MapClientWrapper />
      </div>
      {/* BottomNav */}
      <BottomNav />
    </div>
  );
}
