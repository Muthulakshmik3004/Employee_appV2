import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, Alert, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import API_BASE_URL from "../config";
import DateTimePicker from "@react-native-community/datetimepicker";

const TimePicker = ({ selectedTime, onTimeChange }) => {
  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const periods = ["AM", "PM"];

  return (
    <View style={styles.pickerContainer}>
      <ScrollView style={styles.pickerColumn} nestedScrollEnabled={true}>
        {hours.map((hour) => (
          <TouchableOpacity
            key={hour}
            onPress={() =>
              onTimeChange({ ...selectedTime, hour: parseInt(hour) })
            }
          >
            <Text
              style={[
                styles.pickerItem,
                selectedTime.hour === parseInt(hour) &&
                  styles.pickerItemSelected,
              ]}
            >
              {hour}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.pickerColumn} nestedScrollEnabled={true}>
        {minutes.map((minute) => (
          <TouchableOpacity
            key={minute}
            onPress={() =>
              onTimeChange({ ...selectedTime, minute: parseInt(minute) })
            }
          >
            <Text
              style={[
                styles.pickerItem,
                selectedTime.minute === parseInt(minute) &&
                  styles.pickerItemSelected,
              ]}
            >
              {minute}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.pickerColumn} nestedScrollEnabled={true}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period}
            onPress={() => onTimeChange({ ...selectedTime, period })}
          >
            <Text
              style={[
                styles.pickerItem,
                selectedTime.period === period && styles.pickerItemSelected,
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const PermissionPage = () => {
  const router = useRouter();
  const [permissionType, setPermissionType] = useState("");
  const [reason, setReason] = useState("");

  // ⭐ NEW STATE FOR CUSTOM REASON
  const [customReason, setCustomReason] = useState("");

  const [isPickerVisible, setPickerVisible] = useState(false);

  const permissionOptions = [
    "punch-in",
    "punch-out",
    "onsite-in",
    "onsite-out",
    "lunch-in",
    "lunch-out",
    "tea-in",
    "tea-out",
    "OT",
    "fresh-in",
    "fresh-out",
    "site-office-logout",
    "site-client-login",
    "site-client-logout",
    "site-office-login",
    "Others",
  ];

  // ⭐ Reason Options
  const reasonOptions = [
    "Personal Work",
  "Medical / Health Issue",
  "Hospital Visit",
  "Family Emergency",
  "Urgent Home Work",
  "Official Work Delay",
  "Traffic Delay",
  "Bank Work",
  "Electricity / Water Issue",
  "System / Device Issue",
  "Meeting Delay",
  "Transport Unavailability",
  "Weather Issue",
  "Others",
  ];

  const defaultTime = { hour: 12, minute: 0, period: "PM" };
  const [fromTime, setFromTime] = useState(defaultTime);
  const [toTime, setToTime] = useState(defaultTime);

  const [selectedFromTime, setSelectedFromTime] = useState(fromTime);
  const [selectedToTime, setSelectedToTime] = useState(toTime);

  const [duration, setDuration] = useState("");
  const [permissionTime, setPermissionTime] = useState("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const formatDate = (d) =>
    `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getFullYear()}`;

  const formatTime = (time) =>
    `${time.hour.toString().padStart(2, "0")}:${time.minute
      .toString()
      .padStart(2, "0")} ${time.period}`;

  const calculateDuration = (start, end) => {
    const convertToMinutes = (time) => {
      let hours = time.hour;
      if (time.period === "PM" && hours !== 12) hours += 12;
      if (time.period === "AM" && hours === 12) hours = 0;
      return hours * 60 + time.minute;
    };

    const startMinutes = convertToMinutes(start);
    const endMinutes = convertToMinutes(end);

    if (endMinutes <= startMinutes) return "Invalid time range";

    const diff = endMinutes - startMinutes;
    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return `${h > 0 ? h + " hour " : ""}${m > 0 ? m + " minutes" : ""}`;
  };

  useEffect(() => {
    if (!permissionTime) {
      setDuration("");
      return;
    }

    if (permissionType === "punch-in" || permissionType === "punch-out") {
      setDuration("");
      return;
    }

    const durationText = calculateDuration(fromTime, toTime);
    if (durationText !== "Invalid time range") setDuration(durationText);
    else setDuration("");
  }, [permissionTime, fromTime, toTime, permissionType]);

  const handleSetTime = () => {
    if (permissionType === "punch-in" || permissionType === "punch-out") {
      setFromTime(selectedFromTime);
      setPermissionTime(formatTime(selectedFromTime));
      setPickerVisible(false);
      return;
    }

    const durationText = calculateDuration(selectedFromTime, selectedToTime);
    if (durationText === "Invalid time range") {
      Alert.alert("Invalid Time", "Out Time must be later than In Time.");
      return;
    }

    setFromTime(selectedFromTime);
    setToTime(selectedToTime);
    setPermissionTime(
      `${formatTime(selectedFromTime)} - ${formatTime(selectedToTime)}`
    );
    setPickerVisible(false);
  };

  const handleSendRequest = async () => {
    if (!permissionType.trim() || !permissionTime.trim()) {
      Alert.alert(
        "Invalid Request",
        "Please select a permission type and time."
      );
      return;
    }

    // ⭐ FINAL REASON SENT TO BACKEND
    const finalReason = reason === "Others" ? customReason : reason;

    if (!finalReason.trim()) {
      Alert.alert("Reason Required", "Please enter your reason.");
      return;
    }

    let durationText = "";
    let durationMinutes = 0;

    if (permissionType !== "punch-in" && permissionType !== "punch-out") {
      durationText = calculateDuration(fromTime, toTime);
      if (durationText === "Invalid time range") {
        Alert.alert("Invalid Time", "Out Time must be later than In Time.");
        return;
      }

      const convertToMinutes = (time) => {
        let hours = time.hour;
        if (time.period === "PM" && hours !== 12) hours += 12;
        if (time.period === "AM" && hours === 12) hours = 0;
        return hours * 60 + time.minute;
      };

      durationMinutes =
        convertToMinutes(toTime) - convertToMinutes(fromTime);
    }

    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Error", "User not logged in.");
        return;
      }
      const user = JSON.parse(userData);

      const department = user.department
        ? user.department
        : "Not Assigned";

      const newRequest = {
        user_id: user.emp_id,
        user_name: user.name,
        user_email: user.gmail,
        department,
        permission_type: permissionType,
        reason: finalReason,
        time: permissionTime,
        duration_minutes: durationMinutes,
        duration_text: durationText,
        date: formatDate(selectedDate),
        status: "Pending",
      };

      const response = await fetch(`${API_BASE_URL}/api/permissions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });

      if (response.ok) {
        Alert.alert("Request Sent", "Your permission request has been sent.");
        setPermissionType("");
        setReason("");
        setCustomReason("");
        setPermissionTime("");
      } else {
        Alert.alert("Error", "Failed to send request.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to send request. Try again.");
    }
  };

  return (
    <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.container}>
      <Text style={styles.title}>Permission</Text>

      <Text style={styles.label}>Select Permission Type</Text>
      <View style={styles.dropdownBox}>
        <Picker
          selectedValue={permissionType}
          onValueChange={setPermissionType}
          style={styles.picker}
          dropdownIconColor="white"
        >
          <Picker.Item label="Select permission..." value="" />
          {permissionOptions.map((opt, idx) => (
            <Picker.Item key={idx} label={opt} value={opt} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Permission Time</Text>
      <TouchableOpacity
        style={styles.timeInputBox}
        onPress={() => setPickerVisible(true)}
      >
        <Text
          style={[
            styles.timeInputText,
            !permissionTime && styles.placeholderText,
          ]}
        >
          {permissionTime || "hh:mm AM/PM - hh:mm AM/PM"}
        </Text>
      </TouchableOpacity>

      {duration ? (
        <Text style={styles.durationText}>{duration}</Text>
      ) : null}

      <Text style={styles.label}>Select Date</Text>
      <TouchableOpacity
        style={styles.timeInputBox}
        onPress={() => setDatePickerVisible(true)}
      >
        <Text style={styles.timeInputText}>{formatDate(selectedDate)}</Text>
      </TouchableOpacity>

      {/* ⭐⭐⭐ UPDATED — REASON DROPDOWN */}
      <Text style={styles.label}>Reason for Permission</Text>
      <View style={styles.dropdownBox}>
        <Picker
          selectedValue={reason}
          onValueChange={setReason}
          style={styles.picker}
          dropdownIconColor="white"
        >
          <Picker.Item label="Select reason..." value="" />
          {reasonOptions.map((opt, idx) => (
            <Picker.Item key={idx} label={opt} value={opt} />
          ))}
        </Picker>
      </View>

      {/* ⭐ If user selects "Others" → show text input */}
      {reason === "Others" && (
        <TextInput
          style={styles.noteBox}
          placeholder="Enter your reason..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          multiline
          numberOfLines={4}
          value={customReason}
          onChangeText={setCustomReason}
        />
      )}

      <TouchableOpacity style={styles.sendButton} onPress={handleSendRequest}>
        <Text style={styles.sendButtonText}>Send Request</Text>
      </TouchableOpacity>

      {/* TIME PICKER MODAL – unchanged */}
      <Modal
        transparent
        visible={isPickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.timePickerWrapper}>
              {permissionType === "punch-in" ||
              permissionType === "punch-out" ? (
                <View>
                  <Text style={styles.pickerLabel}>Select Time</Text>
                  <TimePicker
                    selectedTime={selectedFromTime}
                    onTimeChange={setSelectedFromTime}
                  />
                </View>
              ) : (
                <>
                  <View>
                    <Text style={styles.pickerLabel}>From Time</Text>
                    <TimePicker
                      selectedTime={selectedFromTime}
                      onTimeChange={setSelectedFromTime}
                    />
                  </View>
                  <View>
                    <Text style={styles.pickerLabel}>To Time</Text>
                    <TimePicker
                      selectedTime={selectedToTime}
                      onTimeChange={setSelectedToTime}
                    />
                  </View>
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSetTime}
              >
                <Text style={styles.modalButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isDatePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            if (date) setSelectedDate(date);
            setDatePickerVisible(false);
          }}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 35, fontWeight: "bold", color: "white", marginBottom: 30, textAlign: "center" },
  label: { alignSelf: "flex-start", marginLeft: "5%", color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  timeInputBox: { width: "90%", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 15, alignItems: "center", marginBottom: 10 },
  timeInputText: { color: "white", fontSize: 16 },
  placeholderText: { color: "rgba(255,255,255,0.7)" },
  durationText: { color: "white", fontSize: 14, marginBottom: 20 },
  dropdownBox: { width: "90%", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, marginBottom: 20 },
  picker: { color: "white", width: "100%" },
  noteBox: { backgroundColor: "rgba(255,255,255,0.2)", color: "white", width: "90%", height: 100, borderRadius: 10, padding: 15, textAlignVertical: "top", fontSize: 16, marginBottom: 20 },
  sendButton: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  sendButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "95%", backgroundColor: "white", borderRadius: 10, padding: 15 },
  timePickerWrapper: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  pickerLabel: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  pickerContainer: { flexDirection: "row", height: 150 },
  pickerColumn: { width: 45, marginHorizontal: 2 },
  pickerItem: { fontSize: 18, textAlign: "center", paddingVertical: 5 },
  pickerItemSelected: { fontWeight: "bold", color: "#641b9a" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalButton: { marginLeft: 20 },
  modalButtonText: { fontSize: 18, color: "#641b9a", fontWeight: "bold" },
});

export default PermissionPage;