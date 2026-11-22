import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authApi, profileApi, type RegisterInput } from '@/api/auth';
import { ApiError, setAuthToken, setSessionInvalidHandler } from '@/api/client';
import type { Language, Session, User } from '@/api/types';
import { useI18n } from '@/i18n';
import { storage, STORAGE_KEYS } from '@/lib/storage';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthValue {
  status: Status;
  user: User | null;
  isAdmin: boolean;
  /** Código del motivo por el que se cerró la sesión (vencida, cuenta desactivada…). */
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  signIn: (username: string, password: string) => Promise<void>;
  register: (input: Omit<RegisterInput, 'language'>) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  changeLanguage: (lang: Language) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { language, setLanguage } = useI18n();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const signingOut = useRef(false);

  const clearLocalSession = useCallback(async () => {
    setAuthToken(null);
    await Promise.all([storage.remove(STORAGE_KEYS.token), storage.remove(STORAGE_KEYS.user)]);
    queryClient.clear();
    setUser(null);
    setStatus('signedOut');
  }, [queryClient]);

  const persistSession = useCallback(
    async (session: Session) => {
      setAuthToken(session.token);
      await Promise.all([
        storage.set(STORAGE_KEYS.token, session.token),
        storage.set(STORAGE_KEYS.user, JSON.stringify(session.user)),
      ]);
      await setLanguage(session.user.language);
      setUser(session.user);
      setSessionNotice(null);
      setStatus('signedIn');
    },
    [setLanguage],
  );

  // Restaura la sesión guardada y la valida contra el backend.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, rawUser] = await Promise.all([storage.get(STORAGE_KEYS.token), storage.get(STORAGE_KEYS.user)]);
      if (!token || !rawUser) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      setAuthToken(token);
      try {
        setUser(JSON.parse(rawUser));
        setStatus('signedIn');
      } catch {
        await clearLocalSession();
        return;
      }
      try {
        const fresh = await profileApi.me();
        if (cancelled) return;
        setUser(fresh);
        await storage.set(STORAGE_KEYS.user, JSON.stringify(fresh));
      } catch (err) {
        // Sin conexión: se conserva la sesión local; los errores de sesión los maneja el handler.
        if (err instanceof ApiError && err.status === 401) await clearLocalSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearLocalSession]);

  // Cualquier 401 / cuenta desactivada en una petición autenticada cierra la sesión.
  useEffect(() => {
    setSessionInvalidHandler((code) => {
      if (signingOut.current) return;
      signingOut.current = true;
      setSessionNotice(code);
      clearLocalSession().finally(() => {
        signingOut.current = false;
      });
    });
    return () => setSessionInvalidHandler(null);
  }, [clearLocalSession]);

  const signIn = useCallback(
    async (username: string, password: string) => persistSession(await authApi.login(username, password)),
    [persistSession],
  );

  const register = useCallback(
    async (input: Omit<RegisterInput, 'language'>) => persistSession(await authApi.register({ ...input, language })),
    [persistSession, language],
  );

  const signOut = useCallback(async () => {
    signingOut.current = true;
    try {
      await authApi.logout().catch(() => {});
    } finally {
      await clearLocalSession();
      signingOut.current = false;
    }
  }, [clearLocalSession]);

  const updateUser = useCallback(async (next: User) => {
    setUser(next);
    await storage.set(STORAGE_KEYS.user, JSON.stringify(next));
  }, []);

  /** RF09: el idioma se guarda en el dispositivo y, con sesión, en la cuenta. */
  const changeLanguage = useCallback(
    async (lang: Language) => {
      await setLanguage(lang);
      if (status === 'signedIn') {
        const updated = await profileApi.update({ language: lang });
        await updateUser(updated);
      }
    },
    [setLanguage, status, updateUser],
  );

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      isAdmin: user?.role === 'admin',
      sessionNotice,
      clearSessionNotice: () => setSessionNotice(null),
      signIn,
      register,
      signOut,
      updateUser,
      changeLanguage,
    }),
    [status, user, sessionNotice, signIn, register, signOut, updateUser, changeLanguage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
