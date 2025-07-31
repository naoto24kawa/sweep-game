export interface AchievementInfo {
  id: string
  name: string
  description: string
}

/**
 * Achievement定義リスト
 */
export const ACHIEVEMENT_DEFINITIONS: readonly AchievementInfo[] = [
  {
    id: 'first_win',
    name: '初勝利',
    description: '初めて勝利する'
  },
  {
    id: 'veteran',
    name: 'ベテラン',
    description: '10回勝利する'
  },
  {
    id: 'master',
    name: 'マスター',  
    description: '100回勝利する'
  },
  {
    id: 'speed_novice',
    name: 'ノービス速攻',
    description: 'ノービスを60秒以内でクリア'
  },
  {
    id: 'speed_agent',
    name: 'エージェント速攻',
    description: 'エージェントを5分以内でクリア'
  },
  {
    id: 'speed_hacker',
    name: 'ハッカー速攻',
    description: 'ハッカーを10分以内でクリア'
  },
  {
    id: 'streak_5',
    name: '連勝5',
    description: '5連勝を達成する'
  },
  {
    id: 'streak_10',
    name: '連勝10',
    description: '10連勝を達成する'
  },
  {
    id: 'perfect_flags',
    name: '完璧なフラグ',
    description: '全ての地雷にフラグを立ててクリア'
  }
] as const