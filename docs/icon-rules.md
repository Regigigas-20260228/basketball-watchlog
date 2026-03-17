# Icon Rules

## 基本方針
- アイコンは原則 `inline SVG` を使う
- 色は原則 `currentColor` で制御する
- 形状は原則「線画（stroke）」を優先する
- 原則 `fill: none`（塗りつぶしなし）で、必要最小限のみ例外を許可する
- 絵文字・機種依存記号は段階的に廃止する

## token 役割の使い分け
- ナビ通常: `neutral(muted)`（`--icon-default`）
- ナビ active: `primary`（`--icon-primary`）
- CTA: `on-primary`（ボタンの `currentColor` に追従）
- ホーム補助: `secondary`（`--icon-secondary`）
- マイベスト文脈: `accent`（`--icon-accent`）
- 危険操作: `danger`（`--icon-danger`）
- 勝敗文脈: `status`（`--color-win` / `--color-lose` / `--color-draw`）

補足:
- ナビ内のマイベストアイコンはナビ文脈を優先し、`accent` ではなく `neutral/primary` ルールに従う
- `accent` はマイベストの見出し・ランキングなど特別感の文脈でのみ使う

## 実装ルール（SVG）
- `viewBox` は原則 `0 0 24 24`
- `focusable="false"` を付ける（装飾アイコン前提）
- 装飾用途のアイコンは `aria-hidden="true"` を付ける
- 共通クラスは `.iconSvg` を使い、以下を原則とする
  - `stroke: currentColor`
  - `fill: none`
  - `stroke-linecap: round`
  - `stroke-linejoin: round`
  - `vector-effect: non-scaling-stroke`

## サイズと線幅の基本ルール
- ナビアイコン: `17px` / 線幅 `1.8`
- ホーム補助アイコン: `11px` / 線幅 `1.9`
- CTA plus: `24px` / 線幅 `2.2`

運用:
- 同じ文脈ではサイズと線幅をそろえる
- 新しい文脈を追加する場合は、既存バリエーションに寄せる（乱立を避ける）

## 追加時の判断ルール
1. そのアイコンが「主操作」か「補助情報」かを先に決める
2. 文脈（ナビ / CTA / ホーム補助 / マイベスト / 危険 / 勝敗）を確定する
3. 文脈に対応する token 役割を割り当てる
4. `currentColor` で色が追従する実装にする
5. 既存のサイズ・線幅バリエーションに合わせる
6. 絵文字置換時は、余白・行間・クリック領域を変えない

## Set C に進む前提
- Set A/B と同じく、まずは `currentColor` + token 役割の整合を優先する
- 一覧（検索/フィルター/並び替え）とフォーム補助の追加アイコンも、まず `secondary` を基本に設計する
- 危険操作や勝敗文脈に入る箇所のみ、`danger` / `status` を明示的に割り当てる
- 「どの文脈のアイコンか」を先に決めてから形状を選ぶ（見た目先行で増やさない）
