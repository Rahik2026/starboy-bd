"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any;
  isAdmin: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  phone: string;
  email?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@starboybd.com";

function makeEmail(identifier: string) {
  if (identifier.includes("@")) return identifier;
  return `${identifier.toLowerCase().replace(/\s+/g, "_")}@starboybd.com`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          // Fallback profile from Firebase auth
          const email = fbUser.email || "";
          const derivedName = email.replace(/@starboybd\.com$/, "").replace(/_/g, " ");
          setProfile({
            id: fbUser.uid,
            username: fbUser.displayName || derivedName || "User",
            phone: "",
            email: email,
            role: email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = profile?.role === "admin" || profile?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const login = async (identifier: string, password: string) => {
    const email = makeEmail(identifier);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (data: RegisterData) => {
    const email = data.email ? data.email.trim() : makeEmail(data.username);
    const cred = await createUserWithEmailAndPassword(auth, email, data.password);
    await updateFirebaseProfile(cred.user, { displayName: data.username });

    const role = email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
    const newProfile: UserProfile = {
      id: cred.user.uid,
      username: data.username,
      phone: data.phone,
      email: email,
      role,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", cred.user.uid), newProfile);
    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser || !profile) return;
    const ref = doc(db, "users", firebaseUser.uid);
    await updateDoc(ref, data);
    setProfile({ ...profile, ...data });
  };

  return (
    <AuthContext.Provider value={{ user: profile, firebaseUser, isAdmin, isLoading, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
