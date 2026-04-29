import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type SessionUser,
  login as dbLogin,
  logout as dbLogout,
  getCurrentUser,
  initializeSuperAdmin,
} from "../db";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await initializeSuperAdmin();
        const session = getCurrentUser();
        setCurrentUser(session);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const user = await dbLogin(username, password);
      if (user) {
        setCurrentUser(user);
        return true;
      }
      return false;
    },
    [],
  );

  const logout = useCallback(() => {
    dbLogout();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
