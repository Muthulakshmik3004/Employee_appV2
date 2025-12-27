import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

const profileIcon = require("../assets/images/profile10.png");
const userMngmntIcon = require("../assets/images/user mngmnt.jpeg");
const dashboardIcon = require("../assets/images/dashboard (2).png");
const requestsIcon = require("../assets/images/requests.jpeg");

export default function AdminInt() {
  const router = useRouter();

  const menuItems = [
    { title: "Profile", path: "/AdminProfile", icon: <Image source={profileIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },
    { title: "User Management", path: "/userint", icon: <Image source={userMngmntIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },
    { title: "Dashboard", path: "/dashboard", icon: <Image source={dashboardIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },
    { title: "Requests", path: "/AdminRequest", icon: <Image source={requestsIcon} style={{ width: 48, height: 48, borderRadius: 10 }} /> },
  ];

  return (
    <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
      <Text style={styles.title}>Admin Interface</Text>

      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => router.push(item.path as any)}
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
    width: "95%",
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