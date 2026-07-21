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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';

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

export const onAuthChanged = (callback) => onAuthStateChanged(auth, callback);

export const signInWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  await createOrUpdateUserProfile(result.user);
  return result.user;
};

export const signUpWithEmail = async (email, password, name) => {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(result.user, { displayName: name.trim() });
  await createOrUpdateUserProfile(result.user, { name: name.trim() });
  return result.user;
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

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'nextdue' });
    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      extraParams: { include_granted_scopes: 'true' },
    });

    const result = await request.promptAsync(discovery);
    if (result.type !== 'success') throw new Error('Google Sign-In was cancelled');

    const { id_token, access_token } = result.params;
    const credential = GoogleAuthProvider.credential(id_token, access_token);
    const userCredential = await signInWithCredential(auth, credential);
    await createOrUpdateUserProfile(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
};

export const clearCachedUserData = async () => {
  await AsyncStorage.multiRemove([
    'nextdue:user',
    'nextdue:dues',
    'nextdue:profile',
    'nextdue:notification-permission-requested',
  ]);
};

export const signOutUser = async () => {
  try {
    await clearCachedUserData();
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
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
    await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
  }
};

export const getCurrentUser = () => auth.currentUser;