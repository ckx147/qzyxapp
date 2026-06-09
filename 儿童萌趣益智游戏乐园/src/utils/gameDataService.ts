import { Achievement, CheckInState, LeaderboardItem, UserProfile } from '../types';
import { readStorageJson, storageKeys, writeStorageJson } from './gameStorage';
import { INITIAL_ACHIEVEMENTS, INITIAL_CHECKIN_STATE, INITIAL_PROFILE } from './gameHelpers';
import { loadLocalLeaderboard, syncLeaderboard as syncLocalLeaderboard } from './leaderboardService';

export { cloudFunctionNames, createCloudGameDataPort } from './cloudGameDataPort';

export interface GameState {
  profile: UserProfile;
  achievements: Achievement[];
  checkIn: CheckInState;
  leaderboard: LeaderboardItem[];
}

export interface GameDataPort {
  loadGameState(): Promise<GameState>;
  saveGameState(state: GameState): Promise<GameState>;
  syncLeaderboard(profile: UserProfile, leaderboard?: LeaderboardItem[]): Promise<LeaderboardItem[]>;
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

const localGameDataPort: GameDataPort = {
  async loadGameState() {
    const profile = readStorageJson<UserProfile>(storageKeys.profile, INITIAL_PROFILE);
    const achievements = normalizeAchievements(
      readStorageJson<Achievement[]>(storageKeys.achievements, INITIAL_ACHIEVEMENTS)
    );
    const checkIn = normalizeCheckIn(
      readStorageJson<CheckInState>(storageKeys.checkIn, INITIAL_CHECKIN_STATE)
    );
    const leaderboard = syncLocalLeaderboard(profile, loadLocalLeaderboard());

    return { profile, achievements, checkIn, leaderboard };
  },

  async saveGameState(state) {
    const syncedLeaderboard = syncLocalLeaderboard(state.profile, state.leaderboard);

    writeStorageJson(storageKeys.profile, state.profile);
    writeStorageJson(storageKeys.achievements, state.achievements);
    writeStorageJson(storageKeys.checkIn, state.checkIn);

    return {
      ...state,
      leaderboard: syncedLeaderboard,
    };
  },

  async syncLeaderboard(profile, leaderboard = loadLocalLeaderboard()) {
    return syncLocalLeaderboard(profile, leaderboard);
  },
};

const activeGameDataPort = localGameDataPort;

export function loadGameState(): Promise<GameState> {
  return activeGameDataPort.loadGameState();
}

export function saveGameState(state: GameState): Promise<GameState> {
  return activeGameDataPort.saveGameState(state);
}

export function syncLeaderboard(
  profile: UserProfile,
  leaderboard?: LeaderboardItem[]
): Promise<LeaderboardItem[]> {
  return activeGameDataPort.syncLeaderboard(profile, leaderboard);
}
