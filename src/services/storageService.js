import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { getCurrentUser } from './authService';

// Upload a receipt image to Firebase Storage
export const uploadReceipt = async (uri, dueId) => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storagePath = `receipts/${user.uid}/${dueId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    throw error;
  }
};

// Delete a receipt from Firebase Storage
export const deleteReceipt = async (receiptUrl) => {
  if (!receiptUrl) return;

  try {
    const storageRef = ref(storage, receiptUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting receipt:', error);
    // Don't throw on delete errors - the receipt URL reference in Firestore is what matters
  }
};