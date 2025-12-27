import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import API_BASE_URL from "../config";

const OFFICE_COORDS = { latitude: 13.0827, longitude: 80.2707 }; // your real office location
const DISTANCE_LIMIT = 10000000000; // 1 km

// ✅ Utility to calculate distance between two coordinates
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SitePermissionPage = () => {
  const router = useRouter();
  const [step, setStep] = useState("site-office-logout");
  const [loading, setLoading] = useState(false);

  // 🔹 Restore step
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("site_step");
      if (saved) setStep(saved);
    })();
  }, []);

  const saveStep = async (nextStep) => {
    await AsyncStorage.setItem("site_step", nextStep);
    setStep(nextStep);
  };

  // ✅ Fetch current location (for login steps)
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Enable location access to continue.");
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  };

  // 🔹 Step 1: Office Logout → go to map to select client location manually
  const handleOfficeLogout = async () => {
    router.push({
      pathname: "/MapPicker",
      params: { permissionType: "client-location" },
    });
  };

// 🔹 Step 2: Client Login → always allow login (no distance check)
const handleClientLogin = async () => {
  setLoading(true);
  try {
    const current = await getCurrentLocation();
    if (!current) return;

    const saved = await AsyncStorage.getItem("client_location");
    if (!saved) {
      Alert.alert("❌ No Client Location", "Please select client location first.");
      return;
    }

    // ✅ Send login to backend (without distance condition)
    await axios.post(`${API_BASE_URL}/api/site/client-login/`, {
      location: current,
    });

    Alert.alert("✅ Client Login", "Login successful.");
    await saveStep("site-client-logout");
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Something went wrong while verifying client location.");
  } finally {
    setLoading(false);
  }
};


  // 🔹 Step 3: Client Logout (simple save)
  const handleClientLogout = async () => {
    const current = await getCurrentLocation();
    if (!current) return;

    await axios.post(`${API_BASE_URL}/api/site/client-logout/`, { location: current });
    Alert.alert("✅ Client Logout", "Client logout location saved.");
    await saveStep("site-office-login");
  };

  // 🔹 Step 4: Office Login → must be at office coordinates
  const handleOfficeLogin = async () => {
    const current = await getCurrentLocation();
    if (!current) return;

    const distance = getDistanceKm(
      current.latitude,
      current.longitude,
      OFFICE_COORDS.latitude,
      OFFICE_COORDS.longitude
    );

    if (distance <= 0.1) {
      await axios.post(`${API_BASE_URL}/api/site/office-login/`, { location: current });
      Alert.alert("🎉 Completed", "All steps done successfully!");
      await AsyncStorage.removeItem("site_step");
      setStep("done");
    } else {
      Alert.alert("❌ Not at Office", "Please return to the office area to complete this step.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Site Visit Flow</Text>

      {loading && <ActivityIndicator size="large" color="#00ffcc" />}

      {step === "site-office-logout" && (
        <TouchableOpacity style={styles.button} onPress={handleOfficeLogout}>
          <Text style={styles.text}>Select Client Location (Office Logout)</Text>
        </TouchableOpacity>
      )}

      {step === "site-client-login" && (
        <TouchableOpacity style={styles.button} onPress={handleClientLogin}>
          <Text style={styles.text}>Login at Client</Text>
        </TouchableOpacity>
      )}

      {step === "site-client-logout" && (
        <TouchableOpacity style={styles.button} onPress={handleClientLogout}>
          <Text style={styles.text}>Logout from Client</Text>
        </TouchableOpacity>
      )}

      {step === "site-office-login" && (
        <TouchableOpacity style={styles.button} onPress={handleOfficeLogin}>
          <Text style={styles.text}>Login at Office</Text>
        </TouchableOpacity>
      )}

      {step === "done" && <Text style={styles.done}>🎉 All Steps Completed!</Text>}
    </View>
  );
};

export default SitePermissionPage;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },
  title: { color: "#fff", fontSize: 22, marginBottom: 20, fontWeight: "600" },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: 280,
    alignItems: "center",
  },
  text: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  done: { color: "#00FF7F", fontSize: 18, marginTop: 20 },
});
