import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Configure Google Sign-In via OAuth.
// Replace this with a real Firebase/Google Web Client ID before enabling Google auth.
const CLIENT_ID = 'YOUR_WEB_CLIENT_ID';
const isNativeGoogleSignInConfigured = CLIENT_ID && CLIENT_ID !== 'YOUR_WEB_CLIENT_ID';
export const isGoogleSignInConfigured = Platform.OS === 'web' || isNativeGoogleSignInConfigured;

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const onAuthChanged = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createOrUpdateUserProfile(result.user);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signUpWithEmail = async (email, password, name) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await createOrUpdateUserProfile(result.user, { name });
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const userCredential = await signInWithPopup(auth, provider);
      await createOrUpdateUserProfile(userCredential.user);
      return userCredential.user;
    }

    if (!isNativeGoogleSignInConfigured) {
      throw new Error('Google Sign-In is not configured for native yet. Please use email sign-in or add a valid native Google client ID.');
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'nextdue',
    });

    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      extraParams: {
        include_granted_scopes: 'true',
      },
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== 'success') {
      throw new Error('Google Sign-In was cancelled');
    }

    const { id_token, access_token } = result.params;

    // Create Firebase credential with the Google ID token
    const credential = GoogleAuthProvider.credential(id_token, access_token);
    const userCredential = await signInWithCredential(auth, credential);
    await createOrUpdateUserProfile(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  await signOut(auth);
};

const createOrUpdateUserProfile = async (user, extraData = {}) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || extraData.name || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, {
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};