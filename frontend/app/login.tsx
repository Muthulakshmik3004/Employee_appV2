import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import API_BASE_URL from "../config";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api/login/`
});

const LoginScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ username: false, password: false });
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ---------------------------------------------------------
  // ⭐ AUTO FINGERPRINT LOGIN WHEN PAGE OPENS
  // ---------------------------------------------------------
  useEffect(() => {
    const autoFingerprintLogin = async () => {
      try {
        const savedLogin = await AsyncStorage.getItem("lastLogin");
        const allowAuto = await AsyncStorage.getItem("allowAutoFingerprint");

        if (!savedLogin) return;
        if (allowAuto !== "true") return;

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) return;

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Login with Fingerprint",
          fallbackLabel: "Use Passcode",
          requireConfirmation: false,
        });

        if (result.success) {
          const { username: savedUser, password: savedPass } = JSON.parse(savedLogin);
          handleLogin(savedUser, savedPass, true);
        }

      } catch (err) {
        console.log("AUTO BIO ERROR:", err);
      }
    };

    setTimeout(() => {
      autoFingerprintLogin();
    }, 800);

  }, []);
  // ---------------------------------------------------------


  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);


  // ⭐ Manual fingerprint authentication
  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        Alert.alert("Biometric Not Supported", "Your device does not support biometrics.");
        return false;
      }

      if (!isEnrolled) {
        Alert.alert("No Biometrics Found", "Please set up biometrics on your device first.");
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to Login",
        fallbackLabel: "Use passcode",
        requireConfirmation: false,
      });

      return result.success;
    } catch (error) {
      console.error("Biometric Auth Error:", error);
      return false;
    }
  };


  // ⭐ Normal login (NO fingerprint required)
  const handleLogin = async (autoUser = username, autoPass = password) => {
    if (!autoUser || !autoPass) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post('', {
        identifier: autoUser,
        password: autoPass,
      });

      if (response.status === 200) {
        const user = response.data.user;

        const normalizedUser = {
          emp_id: user.emp_id,
          name: user.name,
          role: user.role || user.Role,
          gmail: user.gmail,
          department: user.department || "Not Assigned",
        };

        await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
        await AsyncStorage.setItem("lastLogin", JSON.stringify({ username: autoUser, password: autoPass }));
        await AsyncStorage.setItem("allowAutoFingerprint", "true");

        router.replace('/employeeInterface');
      }

    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", error.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };


  // ⭐ Manual fingerprint login button
  const handleFingerprintLogin = async () => {
    const biometricSuccess = await handleBiometricAuth();

    if (!biometricSuccess) {
      Alert.alert("Authentication Failed", "Fingerprint not verified.");
      return;
    }

    const saved = await AsyncStorage.getItem("lastLogin");
    if (!saved) {
      Alert.alert("No Saved Login", "Please login once using username & password.");
      return;
    }

    const { username: savedUser, password: savedPass } = JSON.parse(saved);

    handleLogin(savedUser, savedPass, true);
  };


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#c2185b" />
        <Text style={styles.loaderText}>Logging in...</Text>
      </View>
    );
  }


  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

          <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>

            <Text style={styles.title}>Welcome Back!</Text>

            <View style={[styles.inputContainer, isFocused.username && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Emp_ID/Gmail"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setIsFocused({ ...isFocused, username: true })}
                onBlur={() => setIsFocused({ ...isFocused, username: false })}
              />
            </View>

            <View style={[styles.inputContainer, isFocused.password && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setIsFocused({ ...isFocused, password: true })}
                onBlur={() => setIsFocused({ ...isFocused, password: false })}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/forgotpassword")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleLogin()} style={styles.buttonWrapper}>
              <LinearGradient colors={['#f48fb1', '#c2185b']} style={styles.button}>
                <Text style={styles.buttonText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* ⭐ Manual fingerprint button */}
            <TouchableOpacity onPress={handleFingerprintLogin} style={{ marginTop: 25 }}>
              <Ionicons name="finger-print" size={50} color="white" />
            </TouchableOpacity>
            <Text style={{ color: 'white', marginTop: 5 }}>Login with Fingerprint</Text>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an Account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>

        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};


// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loader: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff"
  },
  loaderText: {
    marginTop: 10, color: "#555"
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inputFocused: {
    borderColor: '#ffb6c1',
    shadowColor: '#ffb6c1',
    shadowOpacity: 0.7,
  },
  input: { flex: 1, color: 'white', fontSize: 16 },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginRight: 10,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.9)',
    textDecorationLine: 'underline',
  },
  buttonWrapper: { marginTop: 10 },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 30,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  signUpText: { color: 'rgba(255,255,255,0.8)' },
  signUpLink: { color: 'white', fontWeight: 'bold' },
});

export default LoginScreen;
