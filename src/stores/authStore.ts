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
  token?: string;
  user?: AuthUserDto & { avatarUrl?: string };
  requiresVerification?: boolean;
  requiresRegistration?: boolean;
  email?: string;
  devCode?: string;
  googleEmail?: string;
  googleName?: string;
  googlePicture?: string;
};

type RegisterResponse = {
  message?: string;
  token?: string;
  user?: AuthUserDto;
  requiresVerification?: boolean;
  email?: string;
  devCode?: string;
};

type VerifyResponse = {
  message?: string;
  token: string;
  user: AuthUserDto;
};

type ResendCodeResponse = {
  message?: string;
  devCode?: string;
};

interface AuthState {
  token?: string;
  user: { id: string; name: string; email: string; avatar?: string; role?: UserRole } | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (params: { name: string; email: string; password: string; role: UserRole; phoneNumber: string; companyName?: string }) => Promise<RegisterResponse>;
  verifyRegistration: (email: string, code: string) => Promise<void>;
  verifyLogin: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string, purpose: 'register' | 'login_otp') => Promise<ResendCodeResponse>;
  googleSignIn: (credential: string, role?: UserRole, phoneNumber?: string, companyName?: string) => Promise<LoginResponse>;
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
    
    // If OTP verification is required, return the response
    if (resp?.requiresVerification) {
      return resp;
    }
    
    // Otherwise, handle immediate login (backward compatibility)
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
    return resp;
  },
  register: async ({ name, email, password, role, phoneNumber, companyName }) => {
    const resp = await apiFetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName: name, phoneNumber, role, companyName }),
    });
    
    // If OTP verification is required, return the response
    if (resp?.requiresVerification) {
      return resp;
    }
    
    // Otherwise, handle immediate registration (backward compatibility)
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
    return resp;
  },
  verifyRegistration: async (email, code) => {
    const resp = await apiFetch<VerifyResponse>('/auth/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const token = resp?.token;
    if (!token) throw new Error(resp?.message || 'Verification failed');
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
  verifyLogin: async (email, code) => {
    const resp = await apiFetch<VerifyResponse>('/auth/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const token = resp?.token;
    if (!token) throw new Error(resp?.message || 'Verification failed');
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
  resendOtp: async (email, purpose) => {
    const resp = await apiFetch<ResendCodeResponse>('/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose }),
    });
    return resp;
  },
  googleSignIn: async (credential, role, phoneNumber, companyName) => {
    const resp = await apiFetch<LoginResponse>('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    
    if (resp?.requiresRegistration) {
      throw new Error(resp.message || 'No account found with this email. Please register first.');
    }
    
    const token = resp?.token;
    if (!token) throw new Error(resp?.message || 'Google Sign-In failed');
    if (typeof window !== 'undefined') window.localStorage.setItem('intore_token', token);
    set({
      token,
      user: {
        id: resp.user?.id || 'me',
        name: resp.user?.fullName || 'User',
        email: resp.user?.email || '',
        avatar: resp.user?.avatarUrl,
        role: resp.user?.role as UserRole,
      },
      role: (resp.user?.role as UserRole) || 'recruiter',
      isAuthenticated: true,
    });
    return resp;
  },
  logout: () => {
    if (typeof window !== 'undefined') window.localStorage.removeItem('intore_token');
    set({ token: undefined, user: null, isAuthenticated: false });
  },
  setRole: (role) => set({ role }),
}));
