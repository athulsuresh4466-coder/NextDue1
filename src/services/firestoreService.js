import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentUser } from './authService';

const DUES_COLLECTION = 'dues';

const mapDueDocument = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    dueDate: data.dueDate?.toDate?.() || data.dueDate,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    completedDate: data.completedDate?.toDate?.() || data.completedDate,
  };
};

// Get all dues for the current user, ordered by dueDate ascending
export const getDuesByUser = async () => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const duesRef = collection(db, DUES_COLLECTION);
  const q = query(
    duesRef,
    where('userId', '==', user.uid)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(mapDueDocument)
    .sort((a, b) => {
      const dateA = a.dueDate instanceof Date ? a.dueDate.getTime() : new Date(a.dueDate).getTime();
      const dateB = b.dueDate instanceof Date ? b.dueDate.getTime() : new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
};

// Add a new due
export const addDue = async (dueData) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const data = {
    ...dueData,
    userId: user.uid,
    isCompleted: false,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    dueDate: dueData.dueDate instanceof Date
      ? Timestamp.fromDate(dueData.dueDate)
      : dueData.dueDate,
    reminders: dueData.reminders || [],
    notificationIds: [],
  };

  const docRef = await addDoc(collection(db, DUES_COLLECTION), data);
  return { id: docRef.id, ...data };
};

// Update an existing due
export const updateDue = async (dueId, dueData) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const dueRef = doc(db, DUES_COLLECTION, dueId);
  
  // Verify ownership
  const dueSnap = await getDoc(dueRef);
  if (!dueSnap.exists()) throw new Error('Due not found');
  if (dueSnap.data().userId !== user.uid) throw new Error('Not authorized');

  const updateData = { ...dueData, updatedAt: serverTimestamp() };
  
  // Convert Date to Timestamp if needed
  if (updateData.dueDate instanceof Date) {
    updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
  }

  await updateDoc(dueRef, updateData);
  return { id: dueId, ...dueSnap.data(), ...updateData };
};

// Toggle isCompleted status
export const toggleDueStatus = async (dueId, currentStatus) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const dueRef = doc(db, DUES_COLLECTION, dueId);
  const dueSnap = await getDoc(dueRef);
  if (!dueSnap.exists()) throw new Error('Due not found');
  if (dueSnap.data().userId !== user.uid) throw new Error('Not authorized');

  const data = dueSnap.data();
  const newStatus = !currentStatus;

  const updateData = {
    isCompleted: newStatus,
    status: newStatus ? 'paid' : 'pending',
    updatedAt: serverTimestamp(),
    completedDate: newStatus ? Timestamp.fromDate(new Date()) : null,
  };

  await updateDoc(dueRef, updateData);
  return { id: dueId, ...data, ...updateData };
};

// Delete a due
export const deleteDue = async (dueId) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const dueRef = doc(db, DUES_COLLECTION, dueId);
  const dueSnap = await getDoc(dueRef);
  if (!dueSnap.exists()) throw new Error('Due not found');
  if (dueSnap.data().userId !== user.uid) throw new Error('Not authorized');

  await deleteDoc(dueRef);
  return { id: dueId, ...dueSnap.data() };
};

// Get a single due by ID
export const getDueById = async (dueId) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const dueRef = doc(db, DUES_COLLECTION, dueId);
  const dueSnap = await getDoc(dueRef);
  if (!dueSnap.exists()) throw new Error('Due not found');
  if (dueSnap.data().userId !== user.uid) throw new Error('Not authorized');

  const data = dueSnap.data();
  return mapDueDocument(dueSnap);
};