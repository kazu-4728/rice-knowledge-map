-- =============================================================
-- 機材搬入口(machine_entry)をpoint_type ENUMへ追加
-- 0015_add_machine_entry_point_type.sql
--
-- 注意:
-- - 適用はユーザー承認後のみ
-- - 入水口・出水口と並ぶ「田んぼの固定情報」の第三の種別として、
--   田んぼ詳細ページで常に表示する枠に使う（自由追加の"その他"とは区別する）
-- =============================================================

alter type point_type add value if not exists 'machine_entry' after 'outlet';
