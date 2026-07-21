import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { requestNotificationPermissions, setupNotificationHandler } from './src/services/notificationService';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Request notification permissions on first launch
    requestNotificationPermissions();

    // Set up notification tap handler
    const subscription = setupNotificationHandler(navigationRef);

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator navigationRef={navigationRef} />
    </>
  );
}