import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

export type User = { id: string; email: string; name?: string } | null;

type AuthContextType = {
  user: User;
  login: (email: string, _password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "tour.user";

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setUser(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    async login(email: string) {
      setUser({ id: crypto.randomUUID(), email });
    },
    logout() { setUser(null); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
