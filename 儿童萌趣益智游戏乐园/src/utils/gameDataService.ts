import { Achievement, CheckInState, LeaderboardItem, UserProfile } from '../types';
import { readStorageJson, storageKeys, writeStorageJson } from './gameStorage';
import { INITIAL_ACHIEVEMENTS, INITIAL_CHECKIN_STATE, INITIAL_PROFILE } from './gameHelpers';
import { loadLocalLeaderboard, syncLeaderboard } from './leaderboardService';

export interface GameState {
  profile: UserProfile;
  achievements: Achievement[];
  checkIn: CheckInState;
  leaderboard: LeaderboardItem[];
}

function normalizeAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.map(ach => ({
    ...ach,
    tier: ach.tier || 1,
    rewardsClaimed: ach.rewardsClaimed === undefined ? false : ach.rewardsClaimed,
  }));
}

function normalizeCheckIn(checkIn: CheckInState): CheckInState {
  const todayStr = new Date().toISOString().split('T')[0];

  return {
    ...checkIn,
    checkedInToday: checkIn.lastCheckInDate === todayStr,
  };
}

export function loadGameState(): GameState {
  const profile = readStorageJson<UserProfile>(storageKeys.profile, INITIAL_PROFILE);
  const achievements = normalizeAchievements(
    readStorageJson<Achievement[]>(storageKeys.achievements, INITIAL_ACHIEVEMENTS)
  );
  const checkIn = normalizeCheckIn(
    readStorageJson<CheckInState>(storageKeys.checkIn, INITIAL_CHECKIN_STATE)
  );
  const leaderboard = syncLeaderboard(profile, loadLocalLeaderboard());

  return { profile, achievements, checkIn, leaderboard };
}

export function saveGameState(
  profile: UserProfile,
  achievements: Achievement[],
  checkIn: CheckInState,
  leaderboard: LeaderboardItem[]
): GameState {
  const syncedLeaderboard = syncLeaderboard(profile, leaderboard);

  writeStorageJson(storageKeys.profile, profile);
  writeStorageJson(storageKeys.achievements, achievements);
  writeStorageJson(storageKeys.checkIn, checkIn);

  return {
    profile,
    achievements,
    checkIn,
    leaderboard: syncedLeaderboard,
  };
}

export { syncLeaderboard } from './leaderboardService';
