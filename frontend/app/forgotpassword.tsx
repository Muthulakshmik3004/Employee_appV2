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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from "axios";
import API_BASE_URL from "../config";

const BASE_URL = `${API_BASE_URL}/api`;

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [gmail, setGmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [isFocused, setIsFocused] = useState({
    gmail: false,
    otp: false,
    newPassword: false,
    confirmPassword: false,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleSendOtp = async () => {
    if (!gmail) {
      Alert.alert("Error", "Please enter your Gmail");
      return;
    }
    try {
      const res = await axios.post(`${BASE_URL}/teamleader-forgot-password/`, { email: gmail });
      Alert.alert("Success", res.data.message || "If the email exists, an OTP has been sent.");
      setOtpSent(true);
    } catch {
      Alert.alert("Error", "Unable to send OTP. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/teamleader-reset-password/`, {
        email: gmail,
        otp,
        new_password: newPassword,
      });
      Alert.alert("Success", res.data.message || "Password has been reset successfully.");
      router.push("/login");
    } catch {
      Alert.alert("Error", "Invalid OTP or something went wrong.");
    }
  };

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
  };

  const getFocusHandler = (field: keyof typeof isFocused) => () =>
    setIsFocused((prevState) => ({ ...prevState, [field]: true }));

  const getBlurHandler = (field: keyof typeof isFocused) => () =>
    setIsFocused((prevState) => ({ ...prevState, [field]: false }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
            <Text style={styles.title}>Let's Get You Back In</Text>

            {!otpSent ? (
              <>
                <View style={[styles.inputContainer, isFocused.gmail && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Gmail"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={gmail}
                    onChangeText={setGmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={getFocusHandler('gmail')}
                    onBlur={getBlurHandler('gmail')}
                  />
                </View>

                <Animated.View style={animatedStyle}>
                  <TouchableOpacity onPress={handleSendOtp} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                    <LinearGradient
                      colors={['#f48fb1', '#c2185b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>Send OTP</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <>
                <View style={[styles.inputContainer, isFocused.otp && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    onFocus={getFocusHandler('otp')}
                    onBlur={getBlurHandler('otp')}
                  />
                </View>

                <View style={[styles.inputContainer, isFocused.newPassword && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    onFocus={getFocusHandler('newPassword')}
                    onBlur={getBlurHandler('newPassword')}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={24} color="rgba(255, 255, 255, 0.7)" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputContainer, isFocused.confirmPassword && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={getFocusHandler('confirmPassword')}
                    onBlur={getBlurHandler('confirmPassword')}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="rgba(255, 255, 255, 0.7)" />
                  </TouchableOpacity>
                </View>

                <Animated.View style={animatedStyle}>
                  <TouchableOpacity onPress={handleSubmit} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                    <LinearGradient
                      colors={['#f48fb1', '#c2185b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>Submit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 25,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  inputFocused: {
    borderColor: 'rgba(244, 143, 177, 0.8)',
    shadowColor: 'rgba(244, 143, 177, 0.8)',
    shadowOpacity: 0.5,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
