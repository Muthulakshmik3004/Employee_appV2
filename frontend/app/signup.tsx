import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import API_BASE_URL from '../config';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api/signup/`,
});

const SignUpScreen = () => {
  const router = useRouter();

  // States
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState("employee");
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  // Reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      setName('');
      setEmployeeId('');
      setRole('');
      setDepartment('');
      setGmail('');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setOtpSent(false);
      setOtpVerified(false);
    }, [])
  );

  const [isFocused, setIsFocused] = useState({
    name: false,
    employeeId: false,
    role: false,
    department: false,
    gmail: false,
    otp: false,
    password: false,
    confirmPassword: false,
  });
  // console.log("Employee ID:", employeeId)

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;

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

  const handleLoginPressIn = () => {
    Animated.timing(underlineWidth, {
      toValue: 1,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const handleLoginPressOut = () => {
    Animated.timing(underlineWidth, {
      toValue: 0,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const underlineStyle = {
    position: 'absolute' as const,
    bottom: -2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'white',
    transform: [{ scaleX: underlineWidth }],
  };

  const getFocusHandler = (field: keyof typeof isFocused) => () =>
    setIsFocused(prev => ({ ...prev, [field]: true }));
  const getBlurHandler = (field: keyof typeof isFocused) => () =>
    setIsFocused(prev => ({ ...prev, [field]: false }));

  // Step 1: Send OTP
  const handleGetOtp = async () => {
  if (!gmail || !gmail.includes('@gmail.com')) {
    Alert.alert('Error', 'Enter a valid Gmail address');
    return;
  }

  setIsOtpLoading(true);

  try {
    const res = await API.post('', {
      step: 'send_otp',
      name,
      emp_id: employeeId,
      role,
      gmail,
      department,
      password,
      confirm_password: confirmPassword,
    });

    if (res.status === 200) {
      Alert.alert('Success', res.data.message || 'OTP sent to your email');
      setOtpSent(true);
    } else {
      Alert.alert('Error', res.data.error || 'Failed to send OTP');
    }
  } catch (error: any) {

    if (error.response?.data?.error) {
      Alert.alert('Error', error.response.data.error); // ✅ backend error (e.g. Email already registered)
    } else {
      Alert.alert('Error', 'Server error while sending OTP');
    }
  } finally {
    setIsOtpLoading(false);
  }
};


  

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }
    setIsVerifyLoading(true);
    try {
      const res = await API.post('', {
        step: 'verify_otp',
        gmail,
        otp: parseInt(otp, 10),
      });

      if (res.status === 200) {
        Alert.alert('Success', 'OTP verified! Now set your password.');
        setOtpVerified(true);
      } else {
        Alert.alert('Error', res.data.error || 'Failed to verify OTP');
      }
    } catch (error: any) {
      console.log('Verify OTP error:', error.response?.data || error.message);
      if (error.response && error.response.data.error) {
        Alert.alert('Error', error.response.data.error); // backend error
      } else {
        Alert.alert('Error', 'Invalid OTP or server error');
      }
    } finally {
      setIsVerifyLoading(false);
    }

  };

  // Step 3: Signup
  const handleSignup = async () => {
  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match');
    return;
  }

  setIsSignupLoading(true);
  try {
    const res = await API.post('', {
      step: 'set_password',
      gmail,
      password,
      confirm_password: confirmPassword,
      name,           // ✅ Add name
      emp_id: employeeId, // ✅ Add user_id
      role,
      department,
    });

    if (res.status === 200 || res.status === 201) {
      Alert.alert('Success', 'Signup successful!');
      router.push('/login');
    } else {
      Alert.alert('Error', res.data.error || 'Failed to signup');
    }
  } catch (error: any) {
  console.log('Signup error:', error.response?.data || error.message);
  if (error.response && error.response.data.error) {
    Alert.alert('Error', error.response.data.error); // backend error
  } else {
    Alert.alert('Error', 'Server error during signup');
  }
} finally {
  setIsSignupLoading(false);
}

};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.title}>Build Your Account</Text>

            {/* Name */}
            <View style={[styles.inputContainer, isFocused.name && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={name}
                onChangeText={setName}
                onFocus={getFocusHandler('name')}
                onBlur={getBlurHandler('name')}
              />
            </View>

            {/* Employee ID */}
            <View style={[styles.inputContainer, isFocused.employeeId && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Employee ID"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={employeeId}
                onChangeText={setEmployeeId}
                onFocus={getFocusHandler('employeeId')}
                onBlur={getBlurHandler('employeeId')}
              />
            </View>

            {/* Role */}
            <View style={[styles.inputContainer, isFocused.role && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Role"
                
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={role}
                onChangeText={setRole}
                onFocus={getFocusHandler('role')}
                onBlur={getBlurHandler('role')}
              />
            </View>

            {/* Gmail + OTP */}
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
              <TouchableOpacity onPress={handleGetOtp} disabled={isOtpLoading}>
                {isOtpLoading ? (
                  <ActivityIndicator size="small" color="#0000ff" />
                ) : (
                  <Text style={styles.getOtpText}>GET OTP</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OTP */}
            {otpSent && !otpVerified && (
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
                <TouchableOpacity onPress={handleVerifyOtp} disabled={isVerifyLoading}>
                  <LinearGradient
                    colors={['#f48fb1', '#c2185b']}
                    style={styles.button}
                  >
                    {isVerifyLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify OTP</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Password + Department + Confirm Password */}
            {otpVerified && (
              <>
                <View style={[styles.inputContainer, isFocused.password && styles.inputFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={getFocusHandler('password')}
                    onBlur={getBlurHandler('password')}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </View>

                {/* Department Picker */}
                <View style={[styles.inputContainer, isFocused.department && styles.inputFocused]}>
                  <Picker
                    selectedValue={department}
                    onValueChange={setDepartment}
                    dropdownIconColor="white"
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Department" value="" />
                    <Picker.Item label="Software" value="Software" />
                    <Picker.Item label="Hardware" value="Hardware" />
                    <Picker.Item label="Academy" value="Academy" />
                    <Picker.Item label="Digital Design" value="DigitalDesign" />
                    <Picker.Item label="HR" value="HR" />
                    <Picker.Item label="Industrial" value="Industrial" />
                  </Picker>
                </View>

                <View
                  style={[styles.inputContainer, isFocused.confirmPassword && styles.inputFocused]}
                >
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
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleSignup} disabled={isSignupLoading}>
                  <LinearGradient
                    colors={['#f48fb1', '#c2185b']}
                    style={styles.button}
                  >
                    {isSignupLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an Account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                onPressIn={handleLoginPressIn}
                onPressOut={handleLoginPressOut}
              >
                <Text style={styles.loginLink}>Login Here</Text>
                <Animated.View style={underlineStyle} />
              </TouchableOpacity>
            </View>
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
    fontSize: 28,
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
  picker: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  inputFocused: {
    borderColor: 'rgba(244, 143, 177, 0.8)',
    shadowColor: 'rgba(244, 143, 177, 0.8)',
    shadowOpacity: 0.5,
  },
  input: { flex: 1, color: 'white', fontSize: 16 },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'center',
  },
  loginText: { color: 'rgba(255, 255, 255, 0.8)' },
  loginLink: { color: 'white', fontWeight: 'bold' },
  getOtpText: { color: 'black', fontWeight: 'bold', fontSize: 12 },
});

export default SignUpScreen;
