import client from './client';

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  name: string;
  phone?: string;
  email?: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface SendCodeRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    client.post<TokenResponse>('/api/auth/register', data),

  login: (data: LoginRequest) =>
    client.post<TokenResponse>('/api/auth/login', data),

  sendCode: (data: SendCodeRequest) =>
    client.post('/api/auth/send-code', data),

  verifyCode: (data: VerifyCodeRequest) =>
    client.post<TokenResponse>('/api/auth/verify-code', data),

  me: () => client.get('/api/auth/me'),
};
