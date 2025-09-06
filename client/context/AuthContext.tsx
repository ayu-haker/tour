import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

export type User = { id: string; email: string; name?: string } | null;

type AuthContextType = {
  user: User;
  login: (email: string, _password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "tour.user";

function safeParseUser(raw: string | null): User {
  if (!raw) return null;
  try {
    const val = JSON.parse(raw);
    if (val && typeof val === "object" && typeof val.email === "string") {
      return { id: String(val.id || ""), email: val.email, name: val.name };
    }
  } catch {}
  return null;
}

function genId(): string {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {}
  return (
    Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2)
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParseUser(raw);
    if (parsed) setUser(parsed);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    async login(email: string) {
      setUser({ id: genId(), email });
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
