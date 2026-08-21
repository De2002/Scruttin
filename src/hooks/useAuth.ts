import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthUser } from "@/types/auth";

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
  const [auth, setAuth] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setAuth({
          user: session?.user ? mapSupabaseUser(session.user) : null,
          loading: false,
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user) {
        setAuth({ user: mapSupabaseUser(session.user), loading: false });
      } else if (event === "SIGNED_OUT") {
        setAuth({ user: null, loading: false });
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setAuth({ user: mapSupabaseUser(session.user), loading: false });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Send OTP — works for both signup and login
  const sendOtp = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return error.message;
    return null;
  };

  // Verify OTP code and optionally set display name (signup only)
  const verifyOtp = async (
    email: string,
    token: string,
    name?: string
  ): Promise<string | null> => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) return error.message;

    // If a name was supplied (signup), persist it as metadata
    if (name && data.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (updateError) return updateError.message;
    }

    if (data.user) {
      setAuth({ user: mapSupabaseUser(data.user), loading: false });
    }
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
