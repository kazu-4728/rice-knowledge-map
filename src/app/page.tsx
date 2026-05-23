const statusItems = [
  { label: "未対応", value: "3件" },
  { label: "要確認", value: "2件" },
  { label: "経過観察", value: "1件" },
];

const recentRecords = [
  "北側の入水口に泥が溜まりやすい",
  "A田の南東角で雑草が目立つ",
  "B田の出水口を最終確認",
];

export default function Home() {
  return (
    <main className="appShell">
      <section className="heroCard" aria-labelledby="app-title">
        <p className="eyebrow">Rice Knowledge Map</p>
        <h1 id="app-title">田んぼの暗黙知を実画像マップに残す</h1>
        <p className="lead">
          写真、音声、位置情報、対応状況を田んぼの場所に固定して、家族や作業者に引き継ぐためのMVPです。
        </p>
      </section>

      <section className="quickActions" aria-label="記録アクション">
        <button type="button" className="primaryAction">
          写真で記録
        </button>
        <button type="button" className="secondaryAction">
          音声で記録
        </button>
      </section>

      <section className="mapPreview" aria-label="実画像マッププレビュー">
        <div className="mapHeader">
          <div>
            <p className="sectionLabel">実画像マップ</p>
            <h2>圃場と注意箇所</h2>
          </div>
          <span className="mapBadge">GSI aerial</span>
        </div>
        <div className="mockMap" role="img" aria-label="田んぼ区画と記録ピンのプレビュー">
          <span className="field fieldA">A田</span>
          <span className="field fieldB">B田</span>
          <span className="pin inlet">入</span>
          <span className="pin outlet">出</span>
          <span className="pin caution">!</span>
        </div>
        <p className="attribution">地図出典表示エリア。実装時は国土地理院タイルの出典を表示します。</p>
      </section>

      <section className="statusGrid" aria-label="対応状況">
        {statusItems.map((item) => (
          <article key={item.label} className="statusCard">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="recordList" aria-labelledby="recent-records-title">
        <h2 id="recent-records-title">最近の記録</h2>
        <ul>
          {recentRecords.map((record) => (
            <li key={record}>{record}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
