/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameRecord {
  bombGuesses: number;         // 数字炸弹猜测次数
  bombExplodes: number;        // 被炸弹炸到次数（输）
  bombClears: number;          // 炸弹安全排除次数（赢）
  
  klotskiBestMoves3x3: number;  // 3x3 华容道最少步数
  klotskiBestTime3x3: number;   // 3x3 华容道最快时间(秒)
  klotskiBestMoves4x4: number;  // 4x4 华容道最少步数
  klotskiBestTime4x4: number;   // 4x4 华容道最快时间(秒)
  
  schulteBest3x3: number;      // 3x3 舒尔特最快记录(秒)
  schulteBest4x4: number;      // 4x4 舒尔特最快记录(秒)
  schulteBest5x5?: number;     // 5x5 舒尔特最快记录(秒)
  
  gomokuWins: number;          // 五子棋胜利局数
  gomokuLosses: number;        // 五子棋失败局数
  gomokuDraws: number;         // 五子棋平局局数
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;                // Lucide icon name, e.g. "Flame", "Trophy"
  color: string;               // e.g. "bg-amber-100 text-amber-600"
  type: 'bomb' | 'klotski' | 'schulte' | 'gomoku' | 'checkin' | 'interaction' | 'general';
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;            // current progress
  tier?: number;               // 1: 青铜, 2: 白银, 3: 黄金, 4: 白金, 5: 钻石, 6: 大师, 7: 王者
  rewardsClaimed?: boolean;    // true if reward claimed for current tier level
}

export interface CheckInState {
  lastCheckInDate: string | null;  // YYYY-MM-DD
  streak: number;                  // continuous check-in days
  checkedInToday: boolean;
  unlockedItems: string[];         // earned stickers/rewards, e.g. "糖果", "魔法香蕉" etc
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarId: string;            // custom preset avatar list
  points: number;              // user current points
  feedHappiness: number;       // Mascot happiness level
  inventory: Record<string, number>; // Earned food items for feeding: { "cookie": 2, "candy": 5 }
  records: GameRecord;
}

export interface LeaderboardItem {
  id: string;
  nickname: string;
  avatarId: string;
  points: number;
  isCurrentUser?: boolean;
}
