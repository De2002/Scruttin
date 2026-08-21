import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthUser } from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  sendOtp: (email: string) => Promise<string | null>;
  verifyOtp: (email: string, token: string, name?: string) => Promise<string | null>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
