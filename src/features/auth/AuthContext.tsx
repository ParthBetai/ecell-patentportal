import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile, AppRole } from '../../types/database.types';
import { fetchCurrentProfile, upsertProfile } from '../../lib/api';

interface AuthContextType {
  currentUser: Profile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchUserRoleForTesting: (role: AppRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_USER_KEY = 'muj_patent_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured()) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            const profile = await fetchCurrentProfile(session.user.id);
            if (profile) {
              setCurrentUser(profile);
            } else {
              const newProfile = await upsertProfile({
                id: session.user.id,
                university_email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                role: session.user.email?.toLowerCase() === 'patent.admin@jaipur.manipal.edu' ? 'admin' : 'student',
              });
              setCurrentUser(newProfile);
            }
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const profile = await fetchCurrentProfile(session.user.id);
              setCurrentUser(profile);
            } else {
              setCurrentUser(null);
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Local fallback session
          const savedUserId = localStorage.getItem(LOCAL_AUTH_USER_KEY);
          if (savedUserId) {
            const profile = await fetchCurrentProfile(savedUserId);
            setCurrentUser(profile);
          } else {
            // Default to sample student for immediate interactive access
            const profile = await fetchCurrentProfile('student-aditya-uuid');
            if (profile) {
              setCurrentUser(profile);
              localStorage.setItem(LOCAL_AUTH_USER_KEY, profile.id);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing authentication:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const signInWithEmail = async (email: string, password?: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // University domain validation check
      const isUniversityDomain =
        normalizedEmail.endsWith('@jaipur.manipal.edu') ||
        normalizedEmail.endsWith('@muj.manipal.edu') ||
        normalizedEmail.endsWith('@manipal.edu');

      if (!isUniversityDomain) {
        return {
          error:
            'Please use an approved university email address (ending with @jaipur.manipal.edu or @muj.manipal.edu).',
        };
      }

      if (isSupabaseConfigured()) {
        if (password) {
          const { error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) return { error: error.message };
        } else {
          const { error } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });
          if (error) return { error: error.message };
        }
        return {};
      }

      // Local mock login:
      const isAdmin = normalizedEmail === 'patent.admin@jaipur.manipal.edu';
      const userId = isAdmin ? 'admin-coordinator-uuid' : `student-${normalizedEmail.split('@')[0]}`;
      const profile = await upsertProfile({
        id: userId,
        university_email: normalizedEmail,
        full_name: isAdmin ? 'Patent Coordinator' : normalizedEmail.split('@')[0].replace('.', ' '),
        role: isAdmin ? 'admin' : 'student',
      });

      setCurrentUser(profile);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, profile.id);
      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_AUTH_USER_KEY);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUserRoleForTesting = async (role: AppRole) => {
    setIsLoading(true);
    try {
      const targetId = role === 'admin' ? 'admin-coordinator-uuid' : 'student-aditya-uuid';
      const profile = await fetchCurrentProfile(targetId);
      if (profile) {
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_AUTH_USER_KEY, profile.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        signInWithEmail,
        signOut,
        switchUserRoleForTesting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
