import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function signUpAndCreateProfile(params: {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  organizationType: string;
  country: string;
}) {
  const { email, password, fullName, organizationName, organizationType, country } = params;

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await setDoc(doc(db, "users", user.uid), {
    fullName,
    organizationName,
    organizationType,
    type: organizationType,
    country,
    email,
    createdAt: serverTimestamp(),
  });

  return user;
}

export async function signInUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Payload for onboarding completion — matches Firestore users/{uid} schema. Each field stored in its own Firestore field. */
export interface OnboardingPayload {
  mission: string;
  focusAreas: string[];
  fundingNeeds: {
    minGrantSize: number;
    maxGrantSize: number;
    timeline: string;
    regions: string[];
  };
  operationalContext: {
    teamSize: string;
    yearsOperating: number;
    previousGrantExperience: string;
    internationalEligibility: boolean;
  };
  /** Only the "Document text" section from PDF (not the full PDF text). */
  pitchDocText?: string | null;
  /** Optional: from PDF Contact section — stored in respective top-level fields. */
  fullName?: string | null;
  email?: string | null;
  organizationName?: string | null;
  type?: string | null;
  country?: string | null;
  matchedGrants?: any[];
}

export async function updateUserOnboarding(userId: string, data: OnboardingPayload) {
  const userRef = doc(db, "users", userId);
  const payload: Record<string, unknown> = {
    mission: data.mission,
    focusAreas: Array.isArray(data.focusAreas) ? data.focusAreas : [],
    fundingNeeds: data.fundingNeeds,
    operationalContext: data.operationalContext,
    onboardingCompleted: true,
    updatedAt: serverTimestamp(),
  };
  if (data.pitchDocText != null && data.pitchDocText !== "") {
    payload.pitchDocText = data.pitchDocText;
  }
  if (data.fullName != null && data.fullName !== "") payload.fullName = data.fullName;
  if (data.email != null && data.email !== "") payload.email = data.email;
  if (data.organizationName != null && data.organizationName !== "") payload.organizationName = data.organizationName;
  if (data.type != null && data.type !== "") payload.type = data.type;
  if (data.country != null && data.country !== "") payload.country = data.country;
  if (data.matchedGrants !== undefined) payload.matchedGrants = data.matchedGrants;
  await updateDoc(userRef, payload);
}

/** User profile as stored in Firestore users/{uid} */
export interface UserProfile {
  fullName?: string;
  email?: string;
  organizationName?: string;
  organizationType?: string;
  type?: string;
  country?: string;
  mission?: string;
  focusAreas?: string[];
  fundingNeeds?: {
    minGrantSize?: number;
    maxGrantSize?: number;
    timeline?: string;
    regions?: string[];
  };
  operationalContext?: {
    teamSize?: string;
    yearsOperating?: number;
    previousGrantExperience?: string;
    internationalEligibility?: boolean;
  };
  pitchDocText?: string | null;
  onboardingCompleted?: boolean;
  matchedGrants?: any[];
  createdAt?: string;
  updatedAt?: unknown;
}

export async function getCurrentUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

