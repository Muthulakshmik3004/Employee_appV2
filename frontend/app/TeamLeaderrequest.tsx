import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config";
// ✅ Status color function
const getStatusColor = (status: string) => {
  if (!status) return "#007BFF";
  if (status.toLowerCase() === "accepted" || status.toLowerCase() === "approved")
    return "green";
  if (status.toLowerCase() === "rejected") return "red";
  return "orange";
};

export default function TeamLeaderRequests() {
  const [requests, setRequests] = useState({ leaves: [], permissions: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // 🔹 Fetch requests from backend
  const fetchRequests = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const leaderId = await AsyncStorage.getItem("empId");
      if (!leaderId) {
        Alert.alert("Error", "No Team Leader ID found in storage");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/teamleader/${leaderId}/requests/`
      );

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();

      setRequests({
        leaves: data.leaves || [],
        permissions: data.permissions || [],
      });
    } catch (error: any) {
      console.error("Fetch error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  // 🔹 Accept/Reject handler
  const handleAction = async (id: string, type: string, action: string) => {
    try {
      const leaderId = await AsyncStorage.getItem("empId");

      const response = await fetch(`${API_BASE_URL}/api/update-request-status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: id,
          request_type: type,
          status: action,
          leader_id: leaderId,
        }),
      });

      if (!response.ok) {
        console.error("action error",Error)
        throw new Error("Failed to update request");
      }

      const result = await response.json();
      Alert.alert("Success", result.message);

      // ✅ Refresh requests after update
      fetchRequests();
    } catch (error: any) {
      console.error("Action error:", error);
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 🔹 Render Leave Request
  const renderLeaveItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.user_name}</Text>
      <Text style={styles.cardSub}>{item.department}</Text>
      <Text style={styles.cardText}>
        From: {item.from_date} → To: {item.to_date}
      </Text>
      <Text style={styles.cardText}>Applied Date: {item.applied_date}</Text>
      <Text style={styles.cardText}>Reason: {item.reason}</Text>

      {/* ✅ Status with color */}
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
        Status: {item.status}
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "green" }]}
          onPress={() => handleAction(item.id, "leave", "accepted")}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "red" }]}
          onPress={() => handleAction(item.id, "leave", "rejected")}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 🔹 Render Permission Request
  const renderPermissionItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardSub}>{item.department}</Text>
      <Text style={styles.card}>Name: {item.user_name}</Text>
      <Text style={styles.cardText}>Reason: {item.reason}</Text>
      <Text style={styles.cardText}>Permission Type: {item.permission_type}</Text>
      <Text style={styles.cardText}>Applied Date: {item.applied_date}</Text>
      <Text style={styles.cardText}>Time: {item.time}</Text>
      <Text style={styles.cardText}>Duration: {item.duration_text}</Text>

      {/* ✅ Status with color */}
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
        Status: {item.status}
      </Text>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "green" }]}
          onPress={() => handleAction(item.id, "permission", "accepted")}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "red" }]}
          onPress={() => handleAction(item.id, "permission", "rejected")}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Leave Requests */}
      <Text style={styles.heading}>Leave Requests</Text>
      <FlatList
        data={requests.leaves}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderLeaveItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No leave requests found</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRequests();
            }}
          />
        }
      />

      {/* Permission Requests */}
      <Text style={styles.heading}>Permission Requests</Text>
      <FlatList
        data={requests.permissions}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderPermissionItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No permission requests found</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRequests();
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
  heading: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#222" },
  cardSub: { fontSize: 14, color: "#666", marginBottom: 6 },
  cardText: { fontSize: 14, marginBottom: 4, color: "#333" },
  status: { fontSize: 14, fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginVertical: 20,
    fontSize: 14,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
