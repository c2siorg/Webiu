export interface GithubOAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface GithubOAuthExchangeParams {
  client_id: string;
  client_secret: string;
  code: string;
  redirect_uri: string;
}
