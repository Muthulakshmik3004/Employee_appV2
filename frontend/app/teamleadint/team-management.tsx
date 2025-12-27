import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function TeamManagement() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
      <Text style={styles.title}>Team Management</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/teamleadint/team-management/team-members' as any)}>
        <Text style={styles.buttonText}>Team Members</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/teamleadint/team-management/old-members' as any)}>
        <Text style={styles.buttonText}>Old Members</Text>
      </TouchableOpacity>
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 20,
    borderRadius: 25,
    marginBottom: 15,
    width: "83%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
