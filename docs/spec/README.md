# 社内SPIアプリ 仕様書（Codex 引き渡し用）

## このディレクトリの目的

この `docs/spec` 配下のドキュメントは、社内向けSPI試験アプリの実装を行うコーディングエージェント（Codex）に渡す **一次資料**です。
ここに書かれている内容は **すべて確定事項**であり、実装は本仕様に厳密に従ってください。

### 重要な方針（非交渉ルール）

- 「最小構成」「簡易版」など **後回し前提の妥協提案は禁止**
- 仕様に書かれていない要件追加・変更は禁止（必要なら実装前に本仕様書へ反映してから進める）
- 本番/開発/E2Eで認証経路が異なる点を混同しない（dev/test入口をproductionに含めない）
- E2Eは必須（Playwright採用）で、CIで動くことを前提に設計・実装する

---

## Codex への実装指示（そのままプロンプトに貼る）

以下の指示文を、Codexに渡す最初のプロンプトとして使用してください。

> このリポジトリの `docs/spec/README.md` から順に `docs/spec` 配下の仕様書をすべて読み、記載された仕様に厳密に従って実装してください。
> 仕様に書かれていない簡略化・最小構成への変更は行わないでください。
> 実装中に不明点が出た場合は、勝手に補完せず、仕様書側に追記すべき論点として列挙してください。

---

## 仕様書一覧（読む順番）

1. `01_application_spec.md`
   - 業務仕様（要件定義）：ユーザー動線、運用、必須機能、非機能要件の核

2. `02_technical_spec.md`
   - 技術仕様：技術スタック、AWS想定インフラ、Docker、環境別ログイン方針、全体アプローチ

3. `03_data_model.md`
   - データモデル仕様：エンティティ/関係/制約/不変条件（スナップショット方針含む）

4. `04_auth_and_access_control.md`
   - 認証・認可：Staff Google SSO + whitelist + RBAC、Candidate QR+PIN、dev/e2eログイン方針（production除外）

5. `05_exam_and_state_machine.md`
   - 試験進行と状態遷移：ExamVersion（DRAFT/PUBLISHED/ARCHIVED）、Attempt状態、モジュール順序固定、引き継ぎ

6. `06_telemetry_spec.md`
   - 行動計測：イベント、idle=15秒、observed/active集計、材料としての扱い（断定しない）

7. `07_testing_strategy.md`
   - テスト戦略：unit/integration/e2e、Playwright必須シナリオ、CIでの安定動作方針

8. `08_project_structure_and_coding_rules.md`
9. `10_branch_strategy.md`
   - プロジェクト構成と規約：ディレクトリ構成、レイヤ規約、命名、トランザクション、data-testid等

---

## 用語（最小）

- Candidate：受験者
- Staff：運営者（社内ユーザー）
- Ticket：受験票（QRに埋め込むコード）
- PIN：生年月日（固定形式）を入力し照合する認証要素
- Attempt：受験の実体（受験者×試験バージョンの実行）
- Module：試験モジュール（SPI3準拠：言語/非言語/英語/構造）
- Telemetry：問題ごとの滞在/操作時間など行動計測

---

## 更新ルール

仕様の変更が必要になった場合は、実装側で判断せず、この `docs/spec` の該当ファイルを更新してから進めます。
更新時は必ず「何が変わったか」を該当ファイルの先頭（ChangeLog）に追記してください。
