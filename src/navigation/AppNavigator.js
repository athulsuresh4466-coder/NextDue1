import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AddEditDueScreen from '../screens/AddEditDueScreen';
import DetailScreen from '../screens/DetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0f1621' },
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#0f1621',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: '#0f1621' },
    }}
  >
    <MainStack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'NextDue',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 22,
          color: '#FFFFFF',
        },
      }}
    />
    <MainStack.Screen
      name="AddEditDue"
      component={AddEditDueScreen}
      options={({ route }) => ({
        title: route.params?.dueId ? 'Edit Due' : 'Add Due',
      })}
    />
    <MainStack.Screen
      name="Detail"
      component={DetailScreen}
      options={{
        title: 'Due Details',
      }}
    />
    <MainStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        title: 'Profile',
      }}
    />
  </MainStack.Navigator>
);

const AppNavigator = ({ navigationRef }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f1621',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;