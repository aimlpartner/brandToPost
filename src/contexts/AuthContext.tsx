import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, googleProvider, facebookProvider, appleProvider } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { logSilentError } from '../lib/firestore-error';

interface AuthProfile {
  name: string;
  role: string;
  onboarded: boolean;
  isLocked?: boolean;
  lockReason?: string;
  createdAt?: string;
  founderVoiceDescription?: string;
  founderVoiceFileName?: string;
  founderVoiceFileMimeType?: string;
  founderVoiceFileData?: string;
  founderAgentSynthesized?: {
    personaName: string;
    behavioralTraits: string[];
    communicationStyle: string[];
    coreValues: string[];
    decisionHeuristics: string[];
    synthesizedAt: string;
    targetIndustry?: string;
    targetAudience?: string;
    vision?: string;
    mission?: string;
    goal?: string;
    contentPillars?: string[];
  };
  nonBrandedColors?: string[];
  nonBrandedPrimaryFont?: string;
  nonBrandedSecondaryFont?: string;
  automateFounderPosts?: boolean;
  founderPostTimeUtc?: string;
  founderPostAttachmentStyle?: "text-only" | "image-only" | "image-overlay";
  founderPostType?: string;
  founderPostSelectedProducts?: string[];
  signupEmailSent?: boolean;
  firstCampaignEmailSent?: boolean;
  lastActive?: string;
  linkedInProfile?: {
    name?: string;
    headline?: string;
    picture?: string;
    id?: string;
  };
  avatarUrl?: string;
  profilePicture?: string;
  founderBio?: string;
  headline?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: AuthProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (profileData: { name: string; role: string }, firstProductData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (currentUser) {
        setUser(currentUser);
        let signupEmailUpdateAttempted = false;
        let profileInitAttempted = false;

        // Update lastActive timestamp on session load
        const userRef = doc(db, 'users', currentUser.uid);
        updateDoc(userRef, { lastActive: new Date().toISOString() }).catch(() => {
          // If the profile document doesn't exist yet, it will fail, which is handled
          // by initial setDoc creation below.
        });

        // Listen to Firestore user profile document
        unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Check if account is locked by admin (testing phase ended / disabled)
            if (data.isLocked) {
              setUserProfile(data as AuthProfile);
              try {
                await signOut(auth);
              } catch (e) {
                // Ignore signout errors if already invalidated
              }
              setUser(null);
              setUserProfile(null);
              localStorage.removeItem('products');
              localStorage.removeItem('campaigns');
              if (currentUser) {
                localStorage.removeItem(`activeProductId_${currentUser.uid}`);
              }
              setLoading(false);

              const reasonText = encodeURIComponent(data.lockReason || 'The testing phase is over. Access to your account has been locked.');
              if (!window.location.pathname.includes('/login')) {
                window.location.href = `/login?locked=true&reason=${reasonText}`;
              }
              return;
            }

            setUserProfile(data as AuthProfile);
            setLoading(false);

            // Trigger Welcome email if it hasn't been sent yet
            if (!data.signupEmailSent && currentUser.email && !signupEmailUpdateAttempted) {
              // Optimistically update flag to prevent duplicate calls
              signupEmailUpdateAttempted = true;
              try {
                await updateDoc(userRef, { signupEmailSent: true });
                const { triggerBrandedEmail } = await import('../lib/emailTriggers');
                triggerBrandedEmail('signup', currentUser.email, {
                  name: data.name || currentUser.displayName || currentUser.email.split('@')[0]
                });
              } catch (err) {
                logSilentError(err as Error, { context: "updateSignupEmailSent", userId: currentUser.uid });
              }
            }
          } else {
            setUserProfile({ name: '', role: '', onboarded: false });
            setLoading(false);
            
            if (!profileInitAttempted) {
              profileInitAttempted = true;
              // Initialize default profile document for new signup
              setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email || '',
                name: currentUser.displayName || '',
                role: '',
                onboarded: false,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                signupEmailSent: false
              }, { merge: true }).catch(err => {
                logSilentError(err, { context: "initUserProfile", userId: currentUser.uid });
              });
            }
          }
        }, (err) => {
          logSilentError(err, { context: "loadUserProfile", userId: currentUser.uid });
          setUserProfile({ name: '', role: '', onboarded: false });
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      logSilentError(error as Error, { context: "signInWithGoogle" });
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (error) {
      logSilentError(error as Error, { context: "signInWithFacebook" });
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (error) {
      logSilentError(error as Error, { context: "signInWithApple" });
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      logSilentError(error as Error, { context: "signInWithEmail" });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      logSilentError(error as Error, { context: "signUpWithEmail" });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      logSilentError(error as Error, { context: "resetPassword" });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear local storage to prevent data leakage to other users
      localStorage.removeItem('products');
      localStorage.removeItem('campaigns');
      if (user) {
        localStorage.removeItem(`activeProductId_${user.uid}`);
      }
    } catch (error) {
      logSilentError(error as Error, { context: "logout" });
      throw error;
    }
  };

  const completeOnboarding = async (profileData: { name: string; role: string }, firstProductData: any) => {
    if (!user) throw new Error("No authenticated user found.");
    try {
      // 1. Create first product doc
      const productRef = doc(db, 'products', firstProductData.id);
      await setDoc(productRef, {
        ...firstProductData,
        userId: user.uid
      });

      // 2. Create user profile doc
      const userRef = doc(db, 'users', user.uid);
      const profileDoc: any = {
        ...profileData,
        onboarded: true
      };
      if (userProfile?.createdAt) {
        profileDoc.createdAt = userProfile.createdAt;
      } else {
        profileDoc.createdAt = new Date().toISOString();
      }
      await setDoc(userRef, profileDoc, { merge: true });

      // Trigger Onboarding Completed Welcome Email
      if (user.email) {
        try {
          const { triggerBrandedEmail } = await import('../lib/emailTriggers');
          await triggerBrandedEmail('onboarding_complete', user.email, { name: profileData.name });
        } catch (emailErr) {
          logSilentError(emailErr as Error, { context: "completeOnboardingEmail", userId: user.uid });
        }
      }
    } catch (error) {
      logSilentError(error as Error, { context: "completeOnboarding", userId: user.uid });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signInWithFacebook, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
