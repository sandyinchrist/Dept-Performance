import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Department, MonitoringHead, AdminUser, UserSession, UserRole } from '../types';

interface AuthContextType {
  user: UserSession | null;
  login: (role: UserRole, credentials: { id?: string; password: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('perf_tracker_session');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('perf_tracker_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (role: UserRole, credentials: { id?: string; password: string }): Promise<boolean> => {
    try {
      if (role === 'admin') {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('username', credentials.id || 'admin')
          .eq('password', credentials.password)
          .maybeSingle();

        if (data) {
          const session: UserSession = { role: 'admin', id: data.id, name: data.username };
          setUser(session);
          localStorage.setItem('perf_tracker_session', JSON.stringify(session));
          return true;
        }
      } else if (role === 'department') {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('id', credentials.id)
          .eq('password', credentials.password)
          .maybeSingle();

        if (data) {
          const session: UserSession = {
            role: 'department',
            id: data.id,
            name: data.name,
            departmentId: data.id,
          };
          setUser(session);
          localStorage.setItem('perf_tracker_session', JSON.stringify(session));
          return true;
        }
      } else if (role === 'monitor') {
        const { data, error } = await supabase
          .from('monitoring_heads')
          .select('*')
          .eq('id', credentials.id)
          .eq('password', credentials.password)
          .maybeSingle();

        if (data) {
          const session: UserSession = {
            role: 'monitor',
            id: data.id,
            name: data.name,
            monitorId: data.id,
          };
          setUser(session);
          localStorage.setItem('perf_tracker_session', JSON.stringify(session));
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('perf_tracker_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
