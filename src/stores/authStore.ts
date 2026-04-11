import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

type UserRole = 'recruiter' | 'applicant';

type AuthUserDto = {
  id: string;
  email: string;
  role: 'applicant' | 'recruiter' | 'admin';
  fullName: string;
};

type LoginResponse = {
  message?: string;
  token: string;
  user: AuthUserDto;
};

type RegisterResponse = {
  message?: string;
  verificationRequired: boolean;
  email: string;
  devCode?: string;
  user: AuthUserDto;
};

type VerifyResponse = {
  verified: boolean;
  token: string;
  user: AuthUserDto;
};

type ResendCodeResponse = {
  ok: boolean;
  devCode?: string;
};

interface AuthState {
  token?: string;
  user: { id: string; name: string; email: string; avatar?: string; role?: UserRole } | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { name: string; email: string; password: string; role: UserRole; phoneNumber: string; companyName?: string }) => Promise<void>;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? window.localStorage.getItem('intore_token') || undefined : undefined,
  user: null,
  role: 'recruiter',
  isAuthenticated: typeof window !== 'undefined' ? Boolean(window.localStorage.getItem('intore_token')) : false,
  login: async (email, password) => {
    const resp = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const token = resp?.token as string | undefined;
    if (!token) throw new Error(resp?.message || 'Login failed');
    if (typeof window !== 'undefined') window.localStorage.setItem('intore_token', token);
    set({
      token,
      user: {
        id: resp.user?.id || 'me',
        name: resp.user?.fullName || 'User',
        email: resp.user?.email || email,
        role: resp.user?.role as UserRole,
      },
      role: (resp.user?.role as UserRole) || 'recruiter',
      isAuthenticated: true,
    });
  },
  register: async ({ name, email, password, role, phoneNumber, companyName }) => {
    const resp = await apiFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName: name, phoneNumber, role, companyName }),
    });
    const token = resp?.token as string | undefined;
    if (!token) throw new Error(resp?.message || 'Registration failed');
    if (typeof window !== 'undefined') window.localStorage.setItem('intore_token', token);
    set({
      token,
      user: {
        id: resp.user?.id || 'me',
        name: resp.user?.fullName || 'User',
        email: resp.user?.email || email,
        role: resp.user?.role as UserRole,
      },
      role: (resp.user?.role as UserRole) || 'recruiter',
      isAuthenticated: true,
    });
  },
  logout: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('intore_token');
    set({ token: undefined, user: null, isAuthenticated: false });
  },
  setRole: (role) => set({ role }),
}));
