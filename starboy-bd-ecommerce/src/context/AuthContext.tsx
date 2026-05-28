"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
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
  uploadAvatar: (file: File) => Promise<string | null>;
}

interface RegisterData {
  username: string;
  password: string;
  phone: string;
  email?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@starboybd.com";

function makeEmail(identifier: string) {
  const cleanIdentifier = identifier.trim();
  if (cleanIdentifier.includes("@")) return cleanIdentifier;
  return `${cleanIdentifier.toLowerCase().replace(/\s+/g, "_")}@starboybd.com`;
}

function createDefaultProfile(fbUser: FirebaseUser): UserProfile {
  const email = fbUser.email || "";
  const derivedName = email
    .replace(/@starboybd\.com$/, "")
    .replace(/_/g, " ");

  return {
    id: fbUser.uid,
    username: fbUser.displayName || derivedName || "User",
    phone: "",
    email,
    role:
      email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()
        ? "admin"
        : "user",
    createdAt: new Date().toISOString(),
  };
}

async function loadUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  const defaultProfile = createDefaultProfile(fbUser);

  if (!db) return defaultProfile;

  try {
    const userRef = doc(db, "users", fbUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      return { ...defaultProfile, ...(snap.data() as UserProfile) };
    }

    // Create a profile document for Firebase users that do not have one yet.
    await setDoc(userRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error("Failed to load user profile", error);
    // Do not treat a Firestore read/write problem as a logged-out user.
    return defaultProfile;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setFirebaseUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      setFirebaseUser(fbUser);

      try {
        if (fbUser) {
          const userProfile = await loadUserProfile(fbUser);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const isAdmin =
    profile?.role === "admin" ||
    profile?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const login = async (identifier: string, password: string) => {
    if (!auth) throw new Error("Auth not initialized");
    setIsLoading(true);
    try {
      const email = makeEmail(identifier);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await loadUserProfile(cred.user);
      setFirebaseUser(cred.user);
      setProfile(userProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    if (!auth || !db) throw new Error("Auth not initialized");
    const email = data.email
      ? data.email.trim()
      : makeEmail(data.username);
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      data.password
    );
    await updateFirebaseProfile(cred.user, { displayName: data.username });

    const role =
      email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()
        ? "admin"
        : "user";

    const newProfile: UserProfile = {
      id: cred.user.uid,
      username: data.username,
      phone: data.phone,
      email: email,
      role,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", cred.user.uid), newProfile);
    setFirebaseUser(cred.user);
    setProfile(newProfile);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser || !profile || !db) return;
    const ref = doc(db, "users", firebaseUser.uid);
    await updateDoc(ref, data);
    setProfile({ ...profile, ...data });
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!firebaseUser || !storage) return null;
    const storageRef = ref(storage, `avatars/${firebaseUser.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateUserProfile({ avatar: url });
    return url;
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        firebaseUser,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        updateUserProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
