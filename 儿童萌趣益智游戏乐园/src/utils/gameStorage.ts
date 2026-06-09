/**
 * Small storage adapter for the current Web prototype.
 *
 * When this project moves to a WeChat Mini Program runtime, keep callers stable
 * and replace this file's implementation with wx.getStorageSync / wx.setStorageSync.
 */
export const storageKeys = {
  profile: 'kid_games_profile',
  achievements: 'kid_games_achievements',
  checkIn: 'kid_games_checkin',
  leaderboard: 'kid_games_leaderboard',
  synthMutedLegacy: 'kids_applet_synth_muted',
  effectsMuted: 'kids_applet_effects_muted',
  musicMuted: 'kids_applet_music_muted',
  bombCustomAvatars: 'bomb_game_custom_avatars',
  profileCustomAvatars: 'bomb_game_custom_profile_avatars',
} as const;

type StorageKey = typeof storageKeys[keyof typeof storageKeys];

function getWebStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStorageString(key: StorageKey): string | null {
  try {
    return getWebStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorageString(key: StorageKey, value: string): boolean {
  try {
    getWebStorage()?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readStorageJson<T>(key: StorageKey, fallback: T): T {
  const raw = readStorageString(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorageJson<T>(key: StorageKey, value: T): boolean {
  return writeStorageString(key, JSON.stringify(value));
}
