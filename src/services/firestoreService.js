import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUser } from './authService';

const DUES_COLLECTION = 'dues';

const toJsDate = (value) => value?.toDate?.() || value || null;

const mapDueDocument = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    dueDate: toJsDate(data.dueDate),
    createdAt: toJsDate(data.createdAt),
    updatedAt: toJsDate(data.updatedAt),
    completedDate: toJsDate(data.completedDate),
  };
};

const sortDuesByDate = (dues) => [...dues].sort((a, b) => {
  const dateA = a.dueDate instanceof Date ? a.dueDate.getTime() : new Date(a.dueDate).getTime();
  const dateB = b.dueDate instanceof Date ? b.dueDate.getTime() : new Date(b.dueDate).getTime();
  return dateA - dateB;
});

const requireCurrentUser = () => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  return user;
};

const getOwnedDueSnap = async (dueId) => {
  const user = requireCurrentUser();
  const dueRef = doc(db, DUES_COLLECTION, dueId);
  const dueSnap = await getDoc(dueRef);

  if (!dueSnap.exists()) throw new Error('Due not found');
  if (dueSnap.data().userId !== user.uid) throw new Error('Not authorized to access this due');

  return { dueRef, dueSnap };
};

const normalizeDuePayload = (dueData) => {
  const data = { ...dueData };

  if (data.dueDate instanceof Date) {
    data.dueDate = Timestamp.fromDate(data.dueDate);
  }

  data.reminders = Array.isArray(data.reminders)
    ? [...new Set(data.reminders.map(Number))].sort((a, b) => b - a)
    : [];

  return data;
};

export const getDuesByUser = async () => {
  const user = requireCurrentUser();
  const q = query(collection(db, DUES_COLLECTION), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return sortDuesByDate(snapshot.docs.map(mapDueDocument));
};

export const subscribeToDuesByUser = (onNext, onError) => {
  let user;
  try {
    user = requireCurrentUser();
  } catch (error) {
    onError?.(error);
    return () => {};
  }

  const q = query(collection(db, DUES_COLLECTION), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const uniqueDues = new Map();
      snapshot.docs.forEach((docSnap) => uniqueDues.set(docSnap.id, mapDueDocument(docSnap)));
      onNext(sortDuesByDate(Array.from(uniqueDues.values())));
    },
    (error) => {
      console.error('Firestore dues listener error:', error);
      onError?.(error);
    }
  );
};

export const addDue = async (dueData) => {
  const user = requireCurrentUser();
  const normalizedData = normalizeDuePayload(dueData);
  const data = {
    ...normalizedData,
    userId: user.uid,
    isCompleted: false,
    status: 'pending',
    notificationIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, DUES_COLLECTION), data);
  return {
    id: docRef.id,
    ...dueData,
    userId: user.uid,
    isCompleted: false,
    status: 'pending',
    notificationIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const updateDue = async (dueId, dueData) => {
  const { dueRef, dueSnap } = await getOwnedDueSnap(dueId);
  await updateDoc(dueRef, {
    ...normalizeDuePayload(dueData),
    updatedAt: serverTimestamp(),
  });

  return {
    ...mapDueDocument(dueSnap),
    ...dueData,
    id: dueId,
    updatedAt: new Date(),
  };
};

export const updateDueNotificationIds = async (dueId, notificationIds = []) => {
  if (!dueId) return [];
  const { dueRef } = await getOwnedDueSnap(dueId);
  const uniqueNotificationIds = [...new Set(notificationIds.filter(Boolean))];
  await updateDoc(dueRef, {
    notificationIds: uniqueNotificationIds,
    updatedAt: serverTimestamp(),
  });
  return uniqueNotificationIds;
};

export const toggleDueStatus = async (dueId, currentStatus) => {
  const { dueRef, dueSnap } = await getOwnedDueSnap(dueId);
  const newStatus = !currentStatus;
  const updateData = {
    isCompleted: newStatus,
    status: newStatus ? 'paid' : 'pending',
    updatedAt: serverTimestamp(),
    completedDate: newStatus ? Timestamp.fromDate(new Date()) : null,
  };

  await updateDoc(dueRef, updateData);
  return {
    ...mapDueDocument(dueSnap),
    id: dueId,
    isCompleted: newStatus,
    status: updateData.status,
    completedDate: newStatus ? new Date() : null,
    updatedAt: new Date(),
  };
};

export const deleteDue = async (dueId) => {
  const { dueRef, dueSnap } = await getOwnedDueSnap(dueId);
  const deletedDue = mapDueDocument(dueSnap);
  await deleteDoc(dueRef);
  return deletedDue;
};

export const getDueById = async (dueId) => {
  const { dueSnap } = await getOwnedDueSnap(dueId);
  return mapDueDocument(dueSnap);
};