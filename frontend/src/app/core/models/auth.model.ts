/**
 * PostLoginValues from backend (used for workflow interceptors)
 */
export interface PostLoginValues {
  errorcode: number;  // 118 = forced 2FA, 122 = optional 2FA
  suberror?: number;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  isCompleted: boolean;
  redirectUrl?: string;
  action?: string;
  claims?: {
    username: string;
    accountId: string;
    sessionToken: string;
  };
  postLoginValues?: PostLoginValues;
  user?: {
    isAuthenticated: boolean;
  };
}

/**
 * Login request
 */
export interface LoginRequest {
  username: string;
  password: string;
}
