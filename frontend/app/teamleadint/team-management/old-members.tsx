import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  RefreshControl, 
  TouchableOpacity 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import CONFIG_API_BASE_URL from "../../../config";
const API_BASE_URL = `${CONFIG_API_BASE_URL}/api`;

export default function OldMembers() {
  const [oldEmployees, setOldEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamleaderId, setTeamleaderId] = useState<string | null>(null);

  // 🔹 Fetch old employees
  const fetchOldEmployees = async (leaderId: string, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/old-employees/${leaderId}/`);
      if (!response.ok) throw new Error("Failed to fetch old employees");
      const data = await response.json();
      setOldEmployees(data);
    } catch (error) {
      console.error("Error fetching old employees:", error);
      Alert.alert("Error", "Failed to load old employees data");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  // 🔹 Load Team Leader ID
  useEffect(() => {
    const loadLeaderId = async () => {
      const id = await AsyncStorage.getItem("empId");
      setTeamleaderId(id);
      if (id) fetchOldEmployees(id);
    };
    loadLeaderId();
  }, []);

  // 🔹 Pull-to-refresh
  const onRefresh = () => {
    if (!teamleaderId) return;
    setRefreshing(true);
    fetchOldEmployees(teamleaderId, true);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.loader}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.container}>
      <Text style={styles.title}>Old Members</Text>
      <FlatList
        data={oldEmployees}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>Emp ID: {item.emp_id}</Text>
            <Text style={styles.detail}>Gmail: {item.gmail ?? "N/A"}</Text>
            <Text style={styles.detail}>Role: {item.role}</Text>
            <Text style={styles.detail}>Department: {item.department}</Text>
            <Text style={styles.detail}>
              Removed At:{" "}
              {item.removed_date
                ? new Date(item.removed_date).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={styles.detail}>Removed By: {item.removed_by}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No old employees found</Text>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 16, textAlign: "center" },
  card: { backgroundColor: "rgba(255,255,255,0.2)", padding: 15, borderRadius: 12, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "bold", color: "white" },
  detail: { fontSize: 14, color: "white", marginVertical: 2 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  noDataText: { textAlign: "center", marginTop: 20, fontSize: 15, color: "white" },
});