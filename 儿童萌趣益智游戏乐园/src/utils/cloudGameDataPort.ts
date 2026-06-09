import type { LeaderboardItem, UserProfile } from '../types';
import type { GameDataPort, GameState } from './gameDataService';

export const cloudFunctionNames = {
  loginOrCreateUser: 'loginOrCreateUser',
  getHomeState: 'getHomeState',
  saveGameState: 'saveGameState',
  getLeaderboard: 'getLeaderboard',
} as const;

export type CloudFunctionName = typeof cloudFunctionNames[keyof typeof cloudFunctionNames];

export interface CloudFunctionRequest<TData = unknown> {
  name: CloudFunctionName;
  data?: TData;
}

export interface CloudFunctionCaller {
  <TResponse, TData = unknown>(request: CloudFunctionRequest<TData>): Promise<TResponse>;
}

interface HomeStateResponse extends GameState {}

interface SaveGameStateRequest {
  state: GameState;
}

interface LeaderboardRequest {
  profile: UserProfile;
  localFallback?: LeaderboardItem[];
}

interface LeaderboardResponse {
  leaderboard: LeaderboardItem[];
}

export function createCloudGameDataPort(callCloudFunction: CloudFunctionCaller): GameDataPort {
  return {
    async loadGameState() {
      await callCloudFunction<void>({
        name: cloudFunctionNames.loginOrCreateUser,
      });

      return callCloudFunction<HomeStateResponse>({
        name: cloudFunctionNames.getHomeState,
      });
    },

    async saveGameState(state) {
      return callCloudFunction<GameState, SaveGameStateRequest>({
        name: cloudFunctionNames.saveGameState,
        data: { state },
      });
    },

    async syncLeaderboard(profile, leaderboard) {
      const response = await callCloudFunction<LeaderboardResponse, LeaderboardRequest>({
        name: cloudFunctionNames.getLeaderboard,
        data: {
          profile,
          localFallback: leaderboard,
        },
      });

      return response.leaderboard;
    },
  };
}
