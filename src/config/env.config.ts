const getApiBaseUrl = (): string => {
  const rawUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').trim().replace(/\/+$/, '');
  return rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl}/api/v1`;
};

const getWsBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL.trim().replace(/\/+$/, '');
  }
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace(/\/api\/v1$/, '');
};

export const envConfig = {
  NEXT_PUBLIC_API_URL: getApiBaseUrl(),
  NEXT_PUBLIC_WS_URL: getWsBaseUrl(),
};
