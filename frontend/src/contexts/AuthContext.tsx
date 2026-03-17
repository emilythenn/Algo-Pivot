import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    role?: string,
  ) => Promise<{ error: any; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // THEN check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const normalizeAuthError = (error: any) => {
    if (!error) return null;

    const message = (error.message || "").toLowerCase();
    const status = error.status;

    if (status === 429 || message.includes("rate limit") || message.includes("too many")) {
      return {
        ...error,
        message: "Too many attempts. Please wait a minute and try again.",
      };
    }

    if (message.includes("email not confirmed")) {
      return {
        ...error,
        message: "Email not confirmed. Please verify your email before logging in.",
      };
    }

    if (message.includes("invalid login credentials")) {
      return {
        ...error,
        message: "Invalid email or password.",
      };
    }

    if (message.includes("user already registered")) {
      return {
        ...error,
        message: "This email is already registered. Please login instead.",
      };
    }

    if (message.includes("redirect url") || message.includes("redirect_to")) {
      return {
        ...error,
        message: "Auth redirect URL is not allowed. Contact admin to whitelist this app URL in Supabase Auth settings.",
      };
    }

    return error;
  };

  const signUp = async (email: string, password: string, fullName?: string, role?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || "", role: role || "farmer" },
      },
    });
    const needsEmailConfirmation = !data.session;
    return { error: normalizeAuthError(error), needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: normalizeAuthError(error) };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
