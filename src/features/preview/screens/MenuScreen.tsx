import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { members } from "../demo-data";

const menuItems = [
  { label: "田んぼ一覧", value: "4枚", icon: "field" as const },
  { label: "通知設定", value: "", icon: "bell" as const },
  { label: "データ出力", value: "", icon: "cloud" as const },
  { label: "アプリ設定", value: "", icon: "settings" as const },
];

export function MenuScreen() {
  return (
    <div className="screenContent menuScreen">
      <h2 className="screenTitle">メニュー</h2>

      <Card className="syncCard">
        <Icon name="cloud" size={48} />
        <div>
          <strong>同期ステータス</strong>
          <span>すべてのデータは最新です</span>
        </div>
        <div>
          <span>最終バックアップ</span>
          <strong>2025年5月24日 08:30</strong>
        </div>
      </Card>

      <Card className="memberCard">
        <div className="menuCardTitle">
          <Icon name="users" />
          <strong>家族・作業者</strong>
          <span>3人</span>
        </div>
        {members.map((member) => (
          <article key={member.name} className="memberRow">
            <span className="memberAvatar">
              <Icon name="users" size={22} />
            </span>
            <strong>{member.name}</strong>
            <Chip tone={member.role === "管理者" ? "green" : member.role === "編集者" ? "blue" : "gray"}>
              {member.role}
            </Chip>
          </article>
        ))}
      </Card>

      <Card className="pointStatsCard">
        <div className="menuCardTitle">
          <Icon name="pin" />
          <strong>固定ポイント管理</strong>
        </div>
        <div className="pointStats">
          <div>
            <Icon name="drop" />
            <strong>5件</strong>
            <span>入水口</span>
          </div>
          <div>
            <Icon name="waves" />
            <strong>3件</strong>
            <span>出水口</span>
          </div>
          <div>
            <Icon name="warning" />
            <strong>7件</strong>
            <span>注意箇所</span>
          </div>
        </div>
      </Card>

      <Card className="menuList">
        {menuItems.map((item) => (
          <button key={item.label} type="button" className="menuListRow">
            <Icon name={item.icon} />
            <strong>{item.label}</strong>
            {item.value ? <span>{item.value}</span> : null}
          </button>
        ))}
      </Card>
    </div>
  );
}
