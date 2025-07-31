# SWEAP Game 🎮

サイバーパンク風マインスイーパーゲーム

## 概要

SWEAPは従来のマインスイーパーをベースに、サイバーパンクテーマとネオンカラーで視覚的に強化したWebゲームです。TypeScript + PixiJS + PWAで高性能な60FPSゲーム体験を提供します。

## 🎯 ゲーム仕様

### 基本ルール
- 従来のマインスイーパーのルールに準拠
- 数字は隣接する地雷の数を示す
- 地雷を踏むとゲームオーバー

### 難易度設定
| 難易度 | グリッドサイズ | 地雷数 | 名称 |
|--------|-------------|--------|------|
| 初級 | 9×9 | 10 | NOVICE |
| 中級 | 16×16 | 40 | AGENT |
| 上級 | 30×16 | 99 | HACKER |
| カスタム | 可変 | 可変 | CUSTOM |

### 操作方法
- **左クリック**: セル開放
- **右クリック**: フラグ切り替え
- **F5**: ゲーム再開

## 🚀 開発・実行

### 環境要件
- Node.js 18+
- npm

### セットアップ
```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

### 開発用コマンド
```bash
# 型チェック
npm run typecheck

# Lint（ESLint）
npm run lint
```

## 🎨 デザインシステム

### カラーパレット
- **プライマリー**: ダークグレー (#1a1a1a), ディープブラック (#0d0d0d)
- **アクセント**: ネオンブルー (#00ffff), ネオングリーン (#00ff41)
- **警告色**: ネオンレッド (#ff0040), ネオンオレンジ (#ff9500)
- **テキスト**: ホワイト (#ffffff), ライトグレー (#cccccc)

### 数字の色分け
- **1**: ネオンブルー (#00ffff)
- **2**: ネオングリーン (#00ff41)
- **3**: ネオンイエロー (#ffff00)
- **4**: ネオンパープル (#bf00ff)
- **5**: ネオンマゼンタ (#ff00bf)
- **6**: ネオンオレンジ (#ff9500)
- **7**: ネオンライム (#80ff00)
- **8**: ネオンレッド (#ff0040)

## 🛠 技術スタック

### フロントエンド
- **TypeScript** - 型安全性とチーム開発効率
- **PixiJS v8** - WebGL高性能2Dレンダリング、WebGPU対応
- **PWA** - Progressive Web App（オフライン対応、ホーム画面追加）
- **Vite** - 高速開発環境とHMR
- **ESLint** - コード品質管理

### アーキテクチャ特徴
- **モジュラー設計** - 機能別クラス分離
- **パフォーマンス最適化** - オブジェクトプール、監視システム
- **統合管理システム** - サウンド、統計、設定の一元管理

### 将来のインフラ（Cloudflareフルスタック構成）
- **Cloudflare Pages** - PWA配信・ホスティング
- **Cloudflare Workers** - エッジコンピューティング
- **Cloudflare R2** - アセット・画像ストレージ
- **Cloudflare D1** - SQLiteベースデータベース

## 📁 プロジェクト構造

```
sweap-game/
├── __docs__/                    # 設計仕様書
│   ├── DEV_SPECS.md            # 開発仕様書
│   └── SPECIFICATION.md        # プロジェクト仕様書
├── src/
│   ├── animation/              # アニメーション管理
│   │   └── AnimationManager.ts
│   ├── audio/                  # サウンド管理
│   │   └── SoundManager.ts
│   ├── effects/                # 視覚エフェクト
│   │   └── EffectManager.ts
│   ├── game/                   # ゲームロジック
│   │   ├── Game.ts            # メインゲームクラス
│   │   └── GameLogic.ts       # ゲームロジック
│   ├── performance/            # パフォーマンス最適化
│   │   ├── ObjectPool.ts      # オブジェクトプール
│   │   └── PerformanceMonitor.ts # パフォーマンス監視
│   ├── renderer/               # 描画エンジン
│   │   └── GameRenderer.ts
│   ├── settings/               # 設定管理
│   │   └── SettingsManager.ts
│   ├── stats/                  # 統計管理
│   │   └── StatsManager.ts
│   ├── ui/                     # ユーザーインターフェース
│   │   └── GameUI.ts
│   ├── types.ts               # 型定義
│   └── main.ts                # エントリーポイント
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## 🎪 開発フェーズ

### ✅ フェーズ1: コア実装（完了）
- [x] 基本ゲームロジック + UI基盤
- [x] TypeScript + PixiJS環境構築
- [x] セル管理、地雷配置、勝利判定
- [x] 基本的なレンダリングとイベント処理
- [x] 統合されたゲームクラス設計
- [x] モジュラー設計（Game, GameLogic, GameRenderer, GameUI）

### ✅ フェーズ2: 機能拡張（完了）
- [x] サウンドシステム（SoundManager）
- [x] 統計管理（StatsManager）
- [x] 設定管理（SettingsManager）
- [x] パフォーマンス監視（PerformanceMonitor）
- [x] オブジェクトプール最適化（ObjectPool）
- [x] PWA対応（Vite PWA Plugin）

### 🔄 フェーズ3: ビジュアル強化（進行中）
- [x] アニメーション管理フレームワーク（AnimationManager）
- [x] エフェクト管理システム（EffectManager）
- [ ] セル開放時のフェードイン + スケールアップ
- [ ] フラグ設置時のバウンス + グロー
- [ ] ホバー効果（パルス + ボーダーグロー）
- [ ] 地雷爆発時の拡散 + 画面シェイク

### 🚀 フェーズ4: 最適化・公開（準備中）
- [ ] アニメーション・エフェクトの実装
- [ ] 60FPS維持、初回ロード3秒以内
- [ ] レスポンシブデザイン対応
- [ ] アクセシビリティ要件対応
- [ ] PWAアイコン・マニフェスト最終調整

## 🎮 ゲーム状態

- **READY**: ゲーム開始前
- **ACTIVE**: プレイ中
- **SUCCESS**: クリア成功
- **FAILED**: ゲームオーバー
- **PAUSED**: 一時停止

## 📱 対応ブラウザ

- **モダンブラウザ**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **モバイル**: iOS Safari 13+, Android Chrome 80+
- **PWA対応**: iOS 16.4+, Android 5.0+

## 📄 ライセンス

MIT License

## 🤝 貢献

プロジェクトへの貢献を歓迎します！Issue報告やPull Requestをお待ちしています。

---

Made with ⚡ by [naoto24kawa](https://github.com/naoto24kawa)