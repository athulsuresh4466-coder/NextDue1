import { Platform } from 'react-native';
import { updateDueNotificationIds } from './firestoreService';

const isWeb = Platform.OS === 'web';
const CHANNEL_ID = 'dues-reminders';
const DEFAULT_REMINDER_HOUR = 9;

let Notifications = null;
let Device = null;

if (!isWeb) {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0';
  return Number(amount).toLocaleString('en-IN');
};

const normalizeDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const uniqueReminderDays = (reminders = []) => (
  [...new Set(reminders.map(Number).filter((value) => Number.isFinite(value) && value >= 0))]
    .sort((a, b) => b - a)
);

const buildTriggerDate = (dueDate, daysBefore) => {
  const triggerDate = new Date(dueDate);
  triggerDate.setDate(triggerDate.getDate() - daysBefore);
  triggerDate.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);
  return triggerDate;
};

export const requestNotificationPermissions = async () => {
  if (isWeb || !Notifications || !Device) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Due Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    if (!Device.isDevice) {
      console.log('Notifications are limited on simulators/emulators. Test on a physical device.');
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = requested.status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

export const cancelReminders = async (due, options = {}) => {
  if (isWeb || !Notifications) return [];

  const ids = [...new Set(due?.notificationIds || [])];
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.log('Error cancelling notification:', error);
    }
  }

  if (options.persist !== false && due?.id) {
    await updateDueNotificationIds(due.id, []);
  }

  return ids;
};

export const scheduleReminders = async (due, options = {}) => {
  if (isWeb || !Notifications) return [];

  const dueDate = normalizeDate(due?.dueDate);
  const reminders = uniqueReminderDays(due?.reminders);
  if (!due?.id || !dueDate || reminders.length === 0 || due.isCompleted) {
    if (options.persist !== false && due?.id) await updateDueNotificationIds(due.id, []);
    return [];
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) throw new Error('Notification permission was not granted.');

  if (due.notificationIds?.length) {
    await cancelReminders(due, { persist: false });
  }

  const notificationIds = [];
  const now = new Date();

  for (const daysBefore of reminders) {
    const triggerDate = buildTriggerDate(dueDate, daysBefore);
    if (triggerDate <= now) continue;

    const dueLabel = daysBefore === 0
      ? 'today'
      : `in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 NextDue Reminder',
        body: `"${due.title}" is due ${dueLabel} — ₹${formatAmount(due.amount)}`,
        data: { dueId: due.id, screen: 'Detail' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: CHANNEL_ID,
      },
    });

    notificationIds.push(id);
  }

  if (options.persist !== false) {
    await updateDueNotificationIds(due.id, notificationIds);
  }

  return notificationIds;
};

export const rescheduleReminders = async (oldDue, newDue) => {
  await cancelReminders(oldDue, { persist: false });
  return scheduleReminders({ ...newDue, notificationIds: [] });
};

export const cancelAllScheduledNotifications = async () => {
  if (isWeb || !Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getFCMToken = async () => {
  if (isWeb || !Notifications) return null;
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data;
  } catch (error) {
    console.log('Error getting device push token:', error);
    return null;
  }
};

export const setupNotificationHandler = (navigationRef) => {
  if (isWeb || !Notifications) return null;

  const navigateToDue = (dueId) => {
    const nav = navigationRef?.current;
    if (!dueId || !nav?.isReady?.()) return;
    nav.navigate('Detail', { dueId });
  };

  Notifications.getLastNotificationResponseAsync().then((response) => {
    const dueId = response?.notification?.request?.content?.data?.dueId;
    if (dueId) setTimeout(() => navigateToDue(dueId), 350);
  });

  return Notifications.addNotificationResponseReceivedListener((response) => {
    const dueId = response?.notification?.request?.content?.data?.dueId;
    navigateToDue(dueId);
  });
};