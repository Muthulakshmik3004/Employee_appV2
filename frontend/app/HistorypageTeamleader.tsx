import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.183:8000";

// ✅ Format date helper
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ✅ Format datetime helper (with time)
const formatDateTime = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ✅ Status color function
const getStatusColor = (status: string) => {
  if (!status) return "#333";
  if (status.toLowerCase() === "accepted" || status.toLowerCase() === "approved")
    return "green";
  if (status.toLowerCase() === "rejected") return "red";
  return "orange"; // pending or others
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const leaderId = await AsyncStorage.getItem("empId");

      if (!leaderId) {
        Alert.alert("Error", "No Team Leader ID found in storage");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/teamleader/${leaderId}/history/`
      );

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (error: any) {
      console.error("History fetch error:", error);
      Alert.alert("Error", error.message || "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Refresh handler (pull to refresh)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardSub}>
        {item.request_type?.toUpperCase()} • {item.department}
      </Text>
      <Text style={styles.card}>Name: {item.user_name}</Text>

      {/* ✅ Status with color */}
      <Text style={[styles.cardText, { color: getStatusColor(item.status), fontWeight: "bold" }]}>
        Status: {item.status}
      </Text>
      <Text style={styles.cardText}>Permisson Type: {item.permission_type}</Text>

      <Text style={styles.cardText}>Reason: {item.reason}</Text>
      <Text style={styles.cardText}>
        Applied Date: {formatDate(item.applied_date)}
      </Text>
      <Text style={styles.cardText}>Action By: {item.action_by}</Text>
      <Text style={styles.cardText}>
        Action Time: {formatDateTime(item.action_at)}
      </Text>
      {item.request_type === "leave" && (
        <Text style={styles.cardText}>
          From: {formatDate(item.from_date)} To: {formatDate(item.to_date)}
        </Text>
      )}

      {item.request_type === "permission" && (
        <Text style={styles.cardText}>Time: {item.time}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Request History</Text>
      <FlatList
        data={history}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No history found</Text>
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
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginVertical: 20,
    fontSize: 14,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});