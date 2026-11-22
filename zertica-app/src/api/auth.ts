import { request } from './client';
import type { Language, Session, User } from './types';

export interface RegisterInput {
  username: string;
  fullName: string;
  email: string;
  password: string;
  language: Language;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<Session>('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  register: (input: RegisterInput) =>
    request<Session>('/auth/register', { method: 'POST', body: input, auth: false }),
  forgotPassword: (email: string) =>
    request<{ message: string; devResetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};

export const profileApi = {
  me: () => request<{ data: User }>('/me').then((r) => r.data),
  update: (input: Partial<Pick<User, 'fullName' | 'email' | 'language' | 'phone'>>) =>
    request<{ data: User }>('/me', { method: 'PATCH', body: input }).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/me/password', { method: 'PUT', body: { currentPassword, newPassword } }),
};
