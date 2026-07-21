import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  isGoogleSignInConfigured,
} from '../services/authService';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (isSignUp && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      let message = 'An error occurred';
      if (error.code === 'auth/user-not-found') message = 'No account found with this email';
      else if (error.code === 'auth/wrong-password') message = 'Invalid password';
      else if (error.code === 'auth/email-already-in-use') message = 'Email already in use';
      else if (error.code === 'auth/invalid-email') message = 'Invalid email address';
      else if (error.code === 'auth/weak-password') message = 'Password should be at least 6 characters';
      else message = error.message;
      Alert.alert('Authentication Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Google Sign-In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Logo / Title */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="calendar-outline" size={48} color="#4CAF50" />
          </View>
          <Text style={styles.appName}>NextDue</Text>
          <Text style={styles.tagline}>Never miss a payment again</Text>
        </View>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={[styles.googleButton, !isGoogleSignInConfigured && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={loading || !isGoogleSignInConfigured}
        >
          <Ionicons name="logo-google" size={22} color="#FFFFFF" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>
            {isGoogleSignInConfigured ? 'Continue with Google' : 'Google Sign-In not configured'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email/Password Form */}
        <View style={styles.formSection}>
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.emailButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In with Email'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle sign in / sign up */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.toggleText}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1621',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1A2332',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2332',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3A4A',
    paddingVertical: 14,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D3A4A',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#6B7280',
  },
  formSection: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2332',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D3A4A',
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  emailButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default LoginScreen;