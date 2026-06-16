'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  adminLevel?: number;
  region?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nivasi_admin_token');
    const savedUser = localStorage.getItem('nivasi_admin_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const sendOtp = async (phone: string) => {
    await api.post('/auth/send-otp', { phone });
  };

  const verifyOtp = async (phone: string, otp: string) => {
    console.log('=== VERIFY OTP DEBUG ===');
    console.log('phone:', JSON.stringify(phone));
    console.log('otp:', JSON.stringify(otp));
    console.log('phone type:', typeof phone);
    console.log('otp type:', typeof otp);
    console.log('otp length:', otp.length);

    let device_id = localStorage.getItem('nivasi_device_id');
    if (!device_id) {
      device_id = crypto.randomUUID();
      localStorage.setItem('nivasi_device_id', device_id);
    }

    const payload = { phone, otp, device_id };
    console.log('payload:', JSON.stringify(payload));

    const res = await api.post('/auth/verify-otp', payload);
    console.log('response:', res.data);

    const { token, user: userData } = res.data.data;
    if (!['SUPER_ADMIN', 'WING_ADMIN'].includes(userData.role)) {
      throw new Error('Access denied. Admin credentials required.');
    }
    localStorage.setItem('nivasi_admin_token', token);
    localStorage.setItem('nivasi_admin_user', JSON.stringify(userData));
    document.cookie = `nivasi_admin_token=${token}; path=/; max-age=2592000`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('nivasi_admin_token');
    localStorage.removeItem('nivasi_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
