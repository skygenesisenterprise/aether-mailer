export interface AccessTokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken?(): Promise<string | null>;
}

let accessTokenProvider: AccessTokenProvider = {
  async getAccessToken() {
    return null;
  },
};

export function configureAccessTokenProvider(provider: AccessTokenProvider): void {
  accessTokenProvider = provider;
}

export function getAccessTokenProvider(): AccessTokenProvider {
  return accessTokenProvider;
}
