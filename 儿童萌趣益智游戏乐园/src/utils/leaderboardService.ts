import { LeaderboardItem, UserProfile } from '../types';
import { readStorageJson, storageKeys, writeStorageJson } from './gameStorage';

export const INITIAL_LEADERBOARD: LeaderboardItem[] = [
  { id: 'bot_1', nickname: '乐乐兔', avatarId: 'avatar_rabbit', points: 920 },
  { id: 'bot_2', nickname: '聪聪猴', avatarId: 'avatar_fox', points: 780 },
  { id: 'bot_3', nickname: '胖胖熊猫', avatarId: 'avatar_panda', points: 650 },
  { id: 'bot_4', nickname: '萌萌小星人', avatarId: 'avatar_robot', points: 480 },
  { id: 'bot_5', nickname: '皮皮狐', avatarId: 'avatar_fox', points: 300 },
];

export function buildLeaderboardWithUser(
  leaderboard: LeaderboardItem[],
  profile: UserProfile
): LeaderboardItem[] {
  const nextLeaderboard = leaderboard.map(item => ({
    ...item,
    isCurrentUser: item.id === profile.id ? true : item.isCurrentUser,
  }));
  const userRankItem = nextLeaderboard.find(item => item.id === profile.id);

  if (userRankItem) {
    userRankItem.points = profile.points;
    userRankItem.nickname = profile.nickname;
    userRankItem.avatarId = profile.avatarId;
    userRankItem.isCurrentUser = true;
  } else {
    nextLeaderboard.push({
      id: profile.id,
      nickname: profile.nickname,
      avatarId: profile.avatarId,
      points: profile.points,
      isCurrentUser: true,
    });
  }

  return nextLeaderboard.sort((a, b) => b.points - a.points);
}

export function loadLocalLeaderboard(): LeaderboardItem[] {
  return readStorageJson<LeaderboardItem[]>(storageKeys.leaderboard, INITIAL_LEADERBOARD);
}

export function saveLocalLeaderboard(leaderboard: LeaderboardItem[]): boolean {
  return writeStorageJson(storageKeys.leaderboard, leaderboard);
}

export function syncLeaderboard(
  profile: UserProfile,
  leaderboard: LeaderboardItem[] = loadLocalLeaderboard()
): LeaderboardItem[] {
  const syncedLeaderboard = buildLeaderboardWithUser(leaderboard, profile);
  saveLocalLeaderboard(syncedLeaderboard);
  return syncedLeaderboard;
}
