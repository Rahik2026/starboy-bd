"use client";

/**
 * AuthContext — lightweight, client-side auth on top of Firestore.
 *
 * Performance / low-resource notes:
 *  - Session is restored synchronously from localStorage (no flash, no extra
 *    network round-trip on every page) and only verified lazily in the
 *    background, so cold loads on low-end mobiles are instant.
 *  - No realtime Firestore listeners are attached (those keep a socket open and
 *    burn Vercel/Firebase quota). We read on demand only.
 *  - Visit tracking is fire-and-forget and debounced to once per session.
 *
 * Security note: This is a client-side credential check (the existing project
 * uses the Firebase *client* SDK with public config and no server). Passwords
 * are stored only as a salted hash, never in plaintext, but for production-grade
 * security you should move auth to Firebase Authentication or a server. Lock
 * down your Firestore rules so the `users` collection is not world-readable.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { firebaseData } from "@/lib/firebaseData";
import type { UserProfile } from "@/types";

const STORAGE_KEY = "starboy_user";
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase().trim();

interface RegisterInput {
  username: string;
  password: string;
  phone: string;
  email?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<UserProfile>;
  register: (input: RegisterInput) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Tiny, dependency-free salted hash. NOT cryptographically strong — see note
// above — but avoids ever persisting a raw password.
async function hashPassword(password: string): Promise<string> {
  const salted = `starboy::${password}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const data = new TextEncoder().encode(salted);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* fall through to weak hash */
  }
  // Fallback for very old browsers without SubtleCrypto.
  let h = 0;
  for (let i = 0; i < salted.length; i++) {
    h = (Math.imul(31, h) + salted.charCodeAt(i)) | 0;
  }
  return `f${(h >>> 0).toString(16)}`;
}

function sanitize(user: any): UserProfile {
  // Never let the password hash leak into client state / localStorage.
  const { passwordHash, ...safe } = user || {};
  return safe as UserProfile;
}

function readStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function isAdminUser(user: UserProfile | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (ADMIN_EMAIL && user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL) {
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous hydrate from localStorage → no auth flicker on mobile.
  const [user, setUser] = useState<UserProfile | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback((next: UserProfile | null) => {
    setUser(next);
    if (typeof window === "undefined") return;
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage full / private mode — ignore */
    }
  }, []);

  // Lazily refresh the cached profile in the background (non-blocking).
  useEffect(() => {
    let cancelled = false;
    const stored = readStoredUser();
    if (!stored?.id) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await firebaseData
          .from("users")
          .select("*")
          .eq("id", stored.id)
          .single();
        if (!cancelled && data) {
          persist(sanitize(data));
          // Best-effort visit tracking, once per session.
          try {
            const flag = `starboy_visited_${stored.id}`;
            if (!sessionStorage.getItem(flag)) {
              sessionStorage.setItem(flag, "1");
              const visitCount = ((data as any).visitCount || 0) + 1;
              firebaseData
                .from("users")
                .update({ visitCount, lastVisit: new Date().toISOString() })
                .eq("id", stored.id)
                .then(() => {}, () => {});
            }
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* offline — keep cached session */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<UserProfile> => {
      const id = identifier.trim();
      if (!id || !password) throw new Error("Please enter your credentials.");

      // Look up by phone first, then email — firebaseData supports one eq field.
      let found: any = null;
      const byPhone = await firebaseData
        .from("users")
        .select("*")
        .eq("phone", id)
        .single();
      found = byPhone.data;

      if (!found) {
        const byEmail = await firebaseData
          .from("users")
          .select("*")
          .eq("email", id.toLowerCase())
          .single();
        found = byEmail.data;
      }

      if (!found) throw new Error("No account found with those details.");

      const hash = await hashPassword(password);
      if (found.passwordHash && found.passwordHash !== hash) {
        throw new Error("Incorrect password.");
      }

      const safe = sanitize(found);
      persist(safe);
      return safe;
    },
    [persist]
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<UserProfile> => {
      const username = input.username.trim();
      const phone = input.phone.trim();
      const email = (input.email || "").trim().toLowerCase();

      if (!username) throw new Error("Please enter your name.");
      if (!phone) throw new Error("Please enter your phone number.");
      if (!input.password || input.password.length < 4) {
        throw new Error("Password must be at least 4 characters.");
      }

      // Reject duplicate phone numbers.
      const existing = await firebaseData
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();
      if (existing.data) {
        throw new Error("An account with this phone number already exists.");
      }

      const passwordHash = await hashPassword(input.password);
      const role: UserProfile["role"] =
        ADMIN_EMAIL && email === ADMIN_EMAIL ? "admin" : "user";

      const payload = {
        username,
        phone,
        email: email || undefined,
        passwordHash,
        role,
        createdAt: new Date().toISOString(),
        visitCount: 1,
        lastVisit: new Date().toISOString(),
      };

      const { data, error } = await firebaseData.from("users").insert(payload);
      if (error || !data) {
        throw new Error(error?.message || "Could not create your account.");
      }

      const safe = sanitize(data);
      persist(safe);
      return safe;
    },
    [persist]
  );

  const logout = useCallback(() => {
    persist(null);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    }
  }, [persist]);

  const value: AuthContextValue = {
    user,
    isAdmin: isAdminUser(user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>.");
  return ctx;
}
