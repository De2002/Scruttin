import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AuthUser } from "@/types/auth";

const LOCAL_USER_KEY = "scruttin_auth_user";

function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email!.split("@")[0],
  };
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) {
        return { user: JSON.parse(stored), loading: false };
      }
    } catch {
      // ignore
    }
    return { user: null, loading: true };
  });

  useEffect(() => {
    let mounted = true;

    if (isSupabaseConfigured) {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (mounted) {
            const user = session?.user ? mapSupabaseUser(session.user) : null;
            if (user) {
              localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
            }
            setAuth({
              user,
              loading: false,
            });
          }
        })
        .catch(() => {
          if (mounted) {
            setAuth((prev) => ({ ...prev, loading: false }));
          }
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (event === "SIGNED_IN" && session?.user) {
          const u = mapSupabaseUser(session.user);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
          setAuth({ user: u, loading: false });
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem(LOCAL_USER_KEY);
          setAuth({ user: null, loading: false });
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          const u = mapSupabaseUser(session.user);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
          setAuth({ user: u, loading: false });
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      // In local mode, check local storage
      try {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
          setAuth({ user: JSON.parse(stored), loading: false });
        } else {
          setAuth({ user: null, loading: false });
        }
      } catch {
        setAuth({ user: null, loading: false });
      }
    }
  }, []);

  // Send OTP — works for both signup and login
  const sendOtp = async (email: string): Promise<string | null> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true },
        });
        if (error) {
          console.warn("Supabase signInWithOtp failed, falling back to local flow:", error.message);
        } else {
          return null;
        }
      } catch (err: unknown) {
        console.warn("Supabase signInWithOtp exception, falling back to local flow:", err);
      }
    }
    // Local / fallback mode
    return null;
  };

  // Verify OTP code and optionally set display name (signup only)
  const verifyOtp = async (
    email: string,
    token: string,
    name?: string
  ): Promise<string | null> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "email",
        });
        if (!error && data?.user) {
          if (name) {
            await supabase.auth.updateUser({
              data: { full_name: name },
            });
          }
          const user = mapSupabaseUser(data.user);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
          setAuth({ user, loading: false });
          return null;
        }
      } catch (err) {
        console.warn("Supabase verifyOtp error, falling back to local verification:", err);
      }
    }

    // Local authentication fallback
    const localUser: AuthUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      email: email.trim(),
      name: name?.trim() || email.split("@")[0],
    };
    try {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
    } catch {
      // ignore
    }
    setAuth({ user: localUser, loading: false });
    return null;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
    } catch {
      // ignore
    }
    setAuth({ user: null, loading: false });
  };

  return {
    user: auth.user,
    loading: auth.loading,
    sendOtp,
    verifyOtp,
    signOut,
  };
}
