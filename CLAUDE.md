# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
```bash
npm run dev         # Start development server on port 3333
npm run build       # Build for production (TypeScript compile + Vite build)
npm run preview     # Preview production build
```

### Code Quality
```bash
npm run typecheck   # TypeScript type checking (tsc --noEmit)
npm run lint        # ESLint with TypeScript support
```

## Architecture Overview

SWEEP Gameは近未来的なサイバーパンクテーマのマインスイーパーゲームです。TypeScript + PixiJS + PWAで構築された高性能な60FPS Web ゲームです。

### Core Architecture Pattern

**モジュラー設計**により機能が分離され、各システムが独立して動作します：

- **Game** (`src/game/Game.ts`) - メインコーディネータクラス。すべてのシステムを統合管理
- **GameLogic** (`src/game/GameLogic.ts`) - ピュアなゲームロジック（マインスイーパーのルール）
- **GameRenderer** (`src/renderer/GameRenderer.ts`) - PixiJS WebGL描画エンジン
- **GameUI** (`src/ui/GameUI.ts`) - ユーザーインターフェース管理

### System Managers

統合管理システムが各機能を一元化：

- **SoundManager** - オーディオ再生制御
- **StatsManager** - 統計データ管理
- **SettingsManager** - ユーザー設定管理
- **PerformanceMonitor** - パフォーマンス監視
- **AnimationManager** - アニメーション制御
- **EffectManager** - 視覚エフェクト管理

### Event-Driven Design

- **EventManager** - キーボード・DOM イベント処理
- **GameStateWatcher** - ゲーム状態変更の監視・反応
- **DOMHandler** - DOM操作の統一インターフェース

### Performance Optimization

- **ObjectPool** - オブジェクトの再利用によるGC負荷軽減
- WebGL レンダリングによる60FPS維持
- チャンクベースのコード分割 (Vite)

## Key Technical Details

### Dependency Management
- **PixiJS v8** がメインレンダリングエンジン
- PWA対応 (vite-plugin-pwa)
- TypeScript strict mode
- ESLint設定済み

### Game Configuration System
`src/types.ts` の `DIFFICULTY_CONFIGS` でゲーム設定を管理：
- NOVICE: 9×9, 10 mines
- AGENT: 16×16, 40 mines  
- HACKER: 30×16, 99 mines
- CUSTOM: 可変設定

### Development Path Aliases
- `@/*` は `src/*` にマップされています
- すべてのimportで`@/`プレフィックスを使用

### Game States
GameState enum でゲーム状態を管理：
- READY → ACTIVE → SUCCESS/FAILED
- PAUSEDも対応

### PWA Configuration
vite.config.ts でPWA設定：
- 自動更新対応
- 5MBまでキャッシュ
- サイバーパンクテーマカラー (#00ffff)

## File Structure

```
src/
├── game/           # ゲームコアロジック
├── renderer/       # PixiJS描画エンジン
├── ui/            # UI・イベント処理
├── audio/         # サウンド管理
├── stats/         # 統計管理
├── settings/      # 設定管理
├── performance/   # パフォーマンス最適化
├── animation/     # アニメーション管理
├── effects/       # 視覚エフェクト
├── types.ts       # 型定義・設定
└── main.ts        # エントリーポイント
```

## Design System

### Color Scheme (Cyberpunk/Neon)
ネオンカラーパレットが `types.ts` の `NEON_COLORS` で定義済み：
- 数字1-8: それぞれ異なるネオンカラー
- プライマリー: ダークグレー/ディープブラック
- アクセント: ネオンブルー/グリーン
- 警告: ネオンレッド/オレンジ

### Game Mechanics
- 左クリック: セル開放
- 右クリック: フラグ切り替え  
- F5: ゲーム再開
- 60FPS維持が必須要件