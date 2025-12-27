import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import CONFIG_API_BASE_URL from "../../../config";
const API_BASE_URL = `${CONFIG_API_BASE_URL}/api`;

interface Employee {
  emp_id: string;
  name: string;
  role: string;
  department: string;
  email?: string;
  gmail?: string;
}

const TeamMembers: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [teamleaderId, setTeamleaderId] = useState<string | null>(null);

  const fetchEmployees = async (isRefresh = false) => {
    if (!teamleaderId) return;
    if (!isRefresh) setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamleader/${teamleaderId}/members/`
      );
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data: Employee[] = await response.json();
      setEmployees(data);
    } catch (err) {
      Alert.alert("Error", "Failed to load employees");
      console.error(err);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const handleRemove = async (empId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/remove-employee/${empId}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remover_emp_id: teamleaderId }),
      });
      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", result.message || "Employee removed");
        fetchEmployees();
      } else {
        Alert.alert("Error", result.message || "Failed to remove employee");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to remove employee");
    }
  };

  useEffect(() => {
    const getLeaderId = async () => {
      const id = await AsyncStorage.getItem("empId");
      setTeamleaderId(id);
    };
    getLeaderId();
  }, []);

  useEffect(() => {
    if (teamleaderId) fetchEmployees();
  }, [teamleaderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployees(true);
  };

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color="#fff"
        style={{ flex: 1, marginTop: 50 }}
      />
    );

  return (
    <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.container}>
      <Text style={styles.title}>Team Members</Text>

      {employees.length === 0 ? (
        <Text style={styles.noDataText}>No team members found</Text>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.emp_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>Emp ID: {item.emp_id}</Text>
              <Text style={styles.detail}>
                Email: {item.email ?? item.gmail ?? "N/A"}
              </Text>
              <Text style={styles.detail}>Role: {item.role}</Text>
              <Text style={styles.detail}>Department: {item.department}</Text>

              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Confirm Remove", 'Remove ${item.name}?', [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", onPress: () => handleRemove(item.emp_id) },
                  ])
                }
              >
                <LinearGradient
                  colors={["#f48fb1", "#c2185b"]}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </LinearGradient>
  );
};

export default TeamMembers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  detail: {
    fontSize: 14,
    color: "white",
    marginVertical: 2,
  },
  removeBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  removeBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    color: "white",
  },
});