# AGENTS.md

## Codex（コーディングエージェント）向け 実装指示・運用ルール

このリポジトリは「社内SPIアプリ」を実装するためのものです。
Codex は、本ファイルの指示に厳密に従って作業してください。

---

## 1. 仕様書（一次情報）の場所と読み順（必須）

実装の仕様は `docs/spec` にあります。
**必ず次の順番で読み、理解した上で作業**してください。

1. `docs/spec/README.md`
2. `docs/spec/01_application_spec.md`
3. `docs/spec/02_technical_spec.md`
4. `docs/spec/03_data_model.md`
5. `docs/spec/04_auth_and_access_control.md`
6. `docs/spec/05_exam_and_state_machine.md`
7. `docs/spec/06_telemetry_spec.md`
8. `docs/spec/07_testing_strategy.md`
9. `docs/spec/08_project_structure_and_coding_rules.md`

---

## 2. 非交渉ルール（絶対遵守）

### 2.1 禁止事項

- 「最小構成」「簡易版」「後で対応」など、後回し前提の妥協提案は禁止
- 仕様書に書かれていない要件追加・変更は禁止
  - 不明点がある場合は「仕様書へ追記すべき論点」を列挙し、勝手に補完しない
- `app/` 配下にビジネスロジックを置くことは禁止（UIとルーティングのみ）
- 公開済み（PUBLISHED）の試験バージョンを編集可能にする実装は禁止
- production に dev/test 専用ログイン経路を含めることは禁止
- UI 側の表示制御だけで認可を完結させることは禁止（サーバ側で必須）

### 2.2 必須要件（省略不可）

- DB：PostgreSQL 16
- Docker / docker compose 前提
- E2E：Playwright を必ず実施（CIで通ること）
- 行動計測（Telemetry）：idle=15秒、observed/active/回数系
- 端末引き継ぎ（Takeover）：LOCKED + session切替で継続可能
- Staff：Google SSO + whitelist + RBAC
- Candidate：Ticket（QR） + PIN（生年月日）

---

## 3. 作業の進め方（出力フォーマット）

### 3.1 進行手順

作業は常に以下の順で行うこと。

1. **Plan**：変更内容の要約、対象ファイル、影響範囲、テスト方針
2. **Implement**：実装（差分を小さく、段階的に）
3. **Test**：unit/integration/e2e の実行と結果提示
4. **Report**：変更点、注意点、残課題（仕様追記が必要な論点があれば列挙）

### 3.2 変更の粒度

- 1 PR（または1単位の作業）で扱う変更は小さくする
- 例：認証だけ、データモデルだけ、試験進行だけ、telemetryだけ等

---

## 4. Definition of Done（完了条件）

作業単位の完了条件は以下。

- 仕様書の該当箇所を満たしている
- Docker compose で起動できる
- migrate + seed が実行できる
- Unit / Integration / E2E がすべて通る
- E2E 用に操作対象UIに `data-testid` が付与されている
- production に dev/test 専用機構が入っていない

---

## 5. テストに関する必須ルール

- E2E は Playwright
- E2E は Google SSO を通さない（テスト専用ログイン経路を使用）
- `sleep` の固定待機は禁止。Playwright の expect による自動待機を使う
- 失敗時は trace/screenshot/video を保存する

---

## 6. 不明点が出た場合の扱い

仕様上判断が必要な点が出た場合は、勝手に決めずに次を出力すること。

- 「仕様書に追記が必要な論点」一覧
- それぞれの論点について、選択肢とトレードオフ
- 推奨案（ただし決定は仕様書更新後）

---

## 7. 参照ファイル（補助）

Codex 用の補助資料が `.codex/` に配置されている場合は併せて参照すること。

- `.codex/prompt.md`
- `.codex/workflow.md`
- `.codex/definition_of_done.md`
- `.codex/file_map.md`
