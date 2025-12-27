import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const profileIcon = require("../assets/images/profile10.png");
const teamMngmntIcon = require("../assets/images/team mngmnt (2).png");
const requestsIcon = require("../assets/images/requests.jpeg");
const timesheetIcon = require("../assets/images/dashboard (2).png");

export default function TeamLeadInt() {
  const router = useRouter();

  const menuItems = [
    { title: "Profile", path: "./Teamleaderprofile", icon: <Image source={profileIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },
    { title: "Team Management", path: "/teamleadint/team-management", icon: <Image source={teamMngmntIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },
    { title: "Requests", path: "./TeamLeaderHome", icon: <Image source={requestsIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },
    { title: "Timesheet Review", path: "/teamleadint/timesheet-viewer", icon: <Image source={timesheetIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },

  ];

  return (
    <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
      <Text style={styles.title}>Team Lead Interface</Text>

      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => router.push(item.path)} // <-- direct string path
        >
          <View style={styles.buttonContent}>
            {item.icon}
            <Text style={styles.buttonText}>{item.title}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)", // transparent white overlay
    paddingVertical: 20,
    borderRadius: 25,
    marginBottom: 15,
    width: "83%",
    alignItems: "flex-start",
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 15,
  },
});
