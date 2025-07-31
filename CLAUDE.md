# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

SWEEP Gameは、TypeScript + PixiJS + PWAで構築されたサイバーパンク風マインスイーパーゲームです。60FPSの高性能レンダリングとモジュラー設計が特徴です。

## 開発コマンド

### 基本開発コマンド
```bash
# 開発サーバー起動（ポート3333）
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# 型チェック実行
npm run typecheck

# ESLintによるコード品質チェック
npm run lint
```

### 推奨ワークフロー
新機能実装時は以下の順序で実行してください：
1. `npm run typecheck` - 型エラーの事前チェック
2. `npm run lint` - コード品質の確認
3. `npm run build` - ビルドが成功することを確認

## アーキテクチャ構造

### コアシステム
- **Game** (`src/game/Game.ts`) - アプリケーション統合管理とライフサイクル制御
- **ServiceContainer** (`src/core/ServiceContainer.ts`) - 依存性注入とサービス管理
- **GameLogic** (`src/game/GameLogic.ts`) - ピュアなマインスイーパーロジック

### レンダリング層
- **PixiAppManager** (`src/renderer/PixiAppManager.ts`) - PIXI.js初期化とWebGL管理
- **GridManager** (`src/renderer/GridManager.ts`) - セルグリッドの作成・配置
- **CellRenderer** (`src/renderer/CellRenderer.ts`) - 個別セルの描画処理
- **GridEventHandler** (`src/renderer/GridEventHandler.ts`) - マウス・タッチイベント処理

### システム管理
- **AnimationManager** (`src/animation/AnimationManager.ts`) - 統合アニメーション制御
- **SoundManager** (`src/audio/SoundManager.ts`) - 音響効果とBGM管理
- **StatsManager** (`src/stats/StatsManager.ts`) - 統計追跡と実績システム
- **SettingsManager** (`src/settings/SettingsManager.ts`) - 設定管理と永続化

### 重要な型定義
- `GameState` - ゲーム状態（READY, ACTIVE, SUCCESS, FAILED, PAUSED）
- `Difficulty` - 難易度設定（NOVICE, AGENT, HACKER, CUSTOM）
- `CellState` - セル状態（HIDDEN, REVEALED, FLAGGED, QUESTIONED）
- `DIFFICULTY_CONFIGS` - 各難易度の設定値（グリッドサイズ、地雷数）

### 設計原則
1. **単一責任原則** - 各クラスは明確に定義された単一の責任を持つ
2. **依存性注入** - ServiceContainerによる依存関係の管理
3. **イベント駆動設計** - システム間の疎結合を実現
4. **型安全性** - TypeScript厳格モードによる型保証

## 技術仕様

### 開発環境
- TypeScript 5.0+（厳格モード有効）
- PixiJS v8（WebGL/WebGPU対応）
- Vite（開発サーバー・ビルドツール）
- PWA対応（Service Worker自動生成）

### パフォーマンス要件
- 60FPS維持
- 初回ロード時間3秒以内
- メモリ使用量最適化

### ブラウザ対応
- モダンブラウザ（Chrome 80+, Firefox 75+, Safari 13+, Edge 80+）
- モバイル対応（iOS Safari 13+, Android Chrome 80+）

## ファイル構成の特徴

### `/src`ディレクトリ構造
- `animation/` - アニメーションエンジン（TweenEngine, EasingFunctions等）
- `audio/` - サウンドシステム
- `core/` - コアサービス（ServiceContainer, GameServiceBootstrapper）
- `effects/` - 視覚エフェクト管理
- `game/` - ゲームロジックとメイン制御
- `performance/` - パフォーマンス最適化（ObjectPool, PerformanceMonitor）
- `renderer/` - レンダリングシステム
- `settings/` - 設定管理
- `stats/` - 統計・実績システム
- `ui/` - UI管理（DOM操作、イベント管理）

### 設定ファイル
- `vite.config.ts` - PWA設定、ビルド最適化、エイリアス設定（`@`=`src`）
- `tsconfig.json` - TypeScript厳格設定
- `.eslintrc.json` - コード品質ルール

## 実装時の注意点

### コード規約
- 厳格な型チェックを活用
- 単一責任原則に従ったクラス設計
- ServiceContainerを通じた依存性管理
- パフォーマンスを意識したメモリ管理

### 新機能追加の流れ
1. 適切な責任分離でクラスを設計
2. ServiceContainerに新サービスを登録
3. 既存システムとはイベント駆動で連携
4. 型安全性を確保した実装

### デバッグとテスト
- PerformanceMonitorでパフォーマンス監視
- 型チェックとLintを必ず実行
- ブラウザのWebGL/WebGPU対応を確認