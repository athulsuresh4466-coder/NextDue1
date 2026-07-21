import { Platform } from 'react-native';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const isWeb = Platform.OS === 'web';

// Only import expo-notifications on native platforms
let Notifications = null;
let Device = null;

if (!isWeb) {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (isWeb || !Device) {
    console.log('Notifications not supported on web');
    return false;
  }

  if (!Device.isDevice) {
    console.log('Notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  // Android-specific channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('dues-reminders', {
      name: 'Due Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
};

// Schedule reminders for a due
export const scheduleReminders = async (due) => {
  if (isWeb || !Notifications) {
    console.log('Notifications not available on web');
    return [];
  }

  if (!due.reminders || due.reminders.length === 0) return [];

  const notificationIds = [];
  const dueDate = due.dueDate instanceof Date ? due.dueDate : new Date(due.dueDate);

  for (const daysBefore of due.reminders) {
    const triggerDate = new Date(dueDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 0, 0, 0); // 9:00 AM

    // Don't schedule if the date is in the past
    if (triggerDate <= new Date()) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Due Reminder',
        body: `"${due.title}" is due in ${daysBefore} day${daysBefore > 1 ? 's' : ''} — ₹${formatAmount(due.amount)}`,
        data: { dueId: due.id, screen: 'Detail' },
        sound: true,
        priority: Notifications.AndroidImportance.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    notificationIds.push(id);
  }

  // Store notification IDs in Firestore
  if (due.id) {
    const dueRef = doc(db, 'dues', due.id);
    await updateDoc(dueRef, { notificationIds });
  }

  return notificationIds;
};

// Cancel all reminders for a due
export const cancelReminders = async (due) => {
  if (isWeb || !Notifications) return;

  if (!due.notificationIds || due.notificationIds.length === 0) return;

  for (const id of due.notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.log('Error canceling notification:', e);
    }
  }

  // Clear notification IDs in Firestore
  if (due.id) {
    const dueRef = doc(db, 'dues', due.id);
    await updateDoc(dueRef, { notificationIds: [] });
  }
};

// Get FCM token for backup push notifications
export const getFCMToken = async () => {
  if (isWeb || !Notifications) return null;

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data;
  } catch (e) {
    console.log('Error getting FCM token:', e);
    return null;
  }
};

// Handle incoming notifications when app is foregrounded
export const setupNotificationHandler = (navigationRef) => {
  if (isWeb || !Notifications) return null;

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.dueId && navigationRef?.current) {
      navigationRef.current.navigate('Detail', { dueId: data.dueId });
    }
  });

  return subscription;
};

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0';
  return Number(amount).toLocaleString('en-IN');
};