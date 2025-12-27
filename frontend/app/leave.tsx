import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import API_BASE_URL from "../config";

const Leave = () => {
  const Emergency_REASONS = [
    "Fever",
    "Cold",
    "Headache",
    "Vomiting",
    "Body Pain",
    "Stomach Pain",
    "Cough",
    "Throat Infection",
    "Food Poisoning",
    "Other",
  ];

  const NORMAL_REASONS = [
    "Family Visit",
    "Certification Exam",
    "Religious Function",
    "Personal Work",
    "Medical Check-Up",
    "Family Function",
    "Travel Plan (Booked Earlier)",
    "Document Appointment (Aadhaar/PAN/Passport)",
    "Bank Work",
    "House Repair / Maintenance",
    "Other",
  ];

  const [showEmergencyReason, setShowEmergencyReason] = useState(true);
  const [EmergencyReason, setEmergencyReason] = useState("");
  const [customEmergencyReason, setCustomEmergencyReason] = useState("");

  const [normalReason, setNormalReason] = useState("");
  const [customNormalReason, setCustomNormalReason] = useState("");

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [pickerMode, setPickerMode] = useState("from");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showPicker = (mode) => {
    setPickerMode(mode);
    setDatePickerVisibility(true);
  };

  const hidePicker = () => setDatePickerVisibility(false);

  const confirmDate = (date) => {
    pickerMode === "from" ? setFromDate(date) : setToDate(date);
    hidePicker();
  };

  const formatDate = (date) =>
    date ? date.toISOString().split("T")[0] : "";

  // ⭐ Submit Emergency Leave
  const handleEmergencyLeaveSubmit = async () => {
    if (!EmergencyReason)
      return Alert.alert("Error", "Select a Emergency leave reason");

    try {
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);

      const today = new Date().toISOString().split("T")[0];
      const finalReason =
        EmergencyReason === "Other" ? customEmergencyReason : EmergencyReason;

      const body = {
        user_id: user.emp_id,
        user_name: user.name,
        department: user.department,
        fromDate: today,
        toDate: today,
        reason: finalReason,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/leaves/create_Emergency_leave/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        Alert.alert("Success", "Emergency Leave Submitted");
        setEmergencyReason("");
        setCustomEmergencyReason("");
      } else if (data.status === "exists") {
        Alert.alert("Already Taken", "You already applied Emergency leave today.");
      } else if (data.status === "limit") {
        Alert.alert("Limit Reached", "You already used all 3 Emergency leaves this month.");
      }
    } catch (err) {
      Alert.alert("Error", "Cannot submit Emergency leave");
    }
  };

  // ⭐ Submit Normal Leave
  const handleSendRequest = async () => {
    if (!fromDate || !toDate)
      return Alert.alert("Error", "Select From & To Date");

    if (!normalReason)
      return Alert.alert("Error", "Select a normal leave reason");

    try {
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);

      const finalReason =
        normalReason === "Other" ? customNormalReason : normalReason;

      const body = {
        user_id: user.emp_id,
        user_name: user.name,
        department: user.department,
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        reason: finalReason,
      };

      const response = await fetch(`${API_BASE_URL}/api/leaves/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        Alert.alert("Success", "Normal Leave Stored");
        setNormalReason("");
        setCustomNormalReason("");
        setFromDate(null);
        setToDate(null);
      } else {
        Alert.alert("Error", "Leave must be applied at least 3 days before the leave date.");
      }
    } catch (err) {
      Alert.alert("Error", "Cannot submit normal leave");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.container}>
        <Text style={styles.title}>Leave Request</Text>

        {/* TOGGLE BUTTONS */}
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              showEmergencyReason && styles.switchBtnSelected,
            ]}
            onPress={() => setShowEmergencyReason(true)}
          >
            <Text style={styles.switchText}>
              {showEmergencyReason ? "✔ " : ""}🏥 Emergency Leave
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              !showEmergencyReason && styles.switchBtnSelected,
            ]}
            onPress={() => setShowEmergencyReason(false)}
          >
            <Text style={styles.switchText}>
              {!showEmergencyReason ? "✔ " : ""}📅 Normal Leave
            </Text>
          </TouchableOpacity>
        </View>

        {/* Emergency LEAVE SECTION */}
        {showEmergencyReason && (
          <ScrollView style={[styles.sectionCard, styles.sectionCardActive]}>
            <Text style={styles.pinkTitle}>🏥 Emergency Leave</Text>

            <View style={styles.reasonContainer}>
              {Emergency_REASONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.reasonBtn,
                    EmergencyReason === item && styles.reasonBtnSelected,
                  ]}
                  onPress={() => setEmergencyReason(item)}
                >
                  <Text style={styles.reasonText}>
                    {EmergencyReason === item ? "✔ " : ""}
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {EmergencyReason === "Other" && (
              <TextInput
                style={styles.input}
                placeholder="Enter Emergency reason"
                placeholderTextColor="#ccc"
                value={customEmergencyReason}
                onChangeText={setCustomEmergencyReason}
              />
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleEmergencyLeaveSubmit}>
              <Text style={styles.submitText}>Submit Emergency Leave</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* NORMAL LEAVE SECTION */}
        {!showEmergencyReason && (
          <ScrollView style={[styles.sectionCard, styles.sectionCardActive]}>
            <Text style={styles.pinkTitle}>📅 Normal Leave</Text>

            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => showPicker("from")}
            >
              <Text style={styles.dateText}>
                {fromDate ? formatDate(fromDate) : "Select From Date"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => showPicker("to")}
            >
              <Text style={styles.dateText}>
                {toDate ? formatDate(toDate) : "Select To Date"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Select Reason</Text>

            <View style={styles.reasonContainer}>
              {NORMAL_REASONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.reasonBtn,
                    normalReason === item && styles.reasonBtnSelected,
                  ]}
                  onPress={() => setNormalReason(item)}
                >
                  <Text style={styles.reasonText}>
                    {normalReason === item ? "✔ " : ""}
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {normalReason === "Other" && (
              <TextInput
                style={styles.input}
                placeholder="Enter normal leave reason"
                placeholderTextColor="#ccc"
                value={customNormalReason}
                onChangeText={setCustomNormalReason}
              />
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSendRequest}>
              <Text style={styles.submitText}>Send Request</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* DATE PICKER */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={confirmDate}
          onCancel={hidePicker}
        />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },

  title: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  /* Toggle Buttons */
  switchRow: { flexDirection: "row", marginBottom: 15 },

  switchBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255, 182, 205, 0.28)", // 🌸 light pink
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },

  switchBtnSelected: {
    backgroundColor: "rgba(255, 194, 222, 0.9)", // 🌺 highlighted pink
    borderWidth: 2,
    borderColor: "white",
  },

  switchText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },

  /* Pink Section Container */
  sectionCard: {
    flex: 1,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "rgba(255, 170, 200, 0.35)", // light dark pink
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },

  sectionCardActive: {
    backgroundColor: "rgba(255, 170, 200, 0.38)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },

  /* Title pink */
    pinkTitle: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
    },


  /* Reason buttons */
  reasonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  reasonBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  reasonBtnSelected: {
    backgroundColor: "rgba(255, 194, 222, 0.9)",
    borderWidth: 2,
    borderColor: "white",
  },

  reasonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  /* Input */
  input: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 14,
    borderRadius: 10,
    color: "white",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    fontSize: 16,
  },

  /* Date */
  dateInput: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },

  dateText: { color: "white", fontSize: 16 },

  /* Submit Button */
  submitButton: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },

  submitText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Leave;
