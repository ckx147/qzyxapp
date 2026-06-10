import type { CloudFunctionCaller, CloudFunctionRequest } from './cloudGameDataPort';

interface WechatCloudCallResult<TResponse = unknown> {
  result?: TResponse;
}

interface WechatCloudLike {
  callFunction<TResponse = unknown>(request: {
    name: string;
    data?: unknown;
  }): Promise<WechatCloudCallResult<TResponse>>;
}

export interface WechatGlobalLike {
  wx?: {
    cloud?: WechatCloudLike;
  };
}

function getDefaultWechatGlobal(): WechatGlobalLike {
  return globalThis as WechatGlobalLike;
}

export function hasWechatCloud(wxLike: WechatGlobalLike = getDefaultWechatGlobal()): boolean {
  return typeof wxLike.wx?.cloud?.callFunction === 'function';
}

export function createWechatCloudFunctionCaller(
  wxLike: WechatGlobalLike = getDefaultWechatGlobal()
): CloudFunctionCaller | null {
  if (!hasWechatCloud(wxLike)) return null;

  return async function callWechatCloudFunction<TResponse, TData = unknown>(
    request: CloudFunctionRequest<TData>
  ): Promise<TResponse> {
    const response = await wxLike.wx!.cloud!.callFunction<TResponse>({
      name: request.name,
      data: request.data,
    });

    return response.result as TResponse;
  };
}
