import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CONFIG_API_BASE_URL from "../config";
const API_BASE_URL = `${CONFIG_API_BASE_URL}`;

// ------------------ HELPERS ------------------
const formatDate = (dateString?: string | null) => {
  if (!dateString || dateString === "null" || dateString === "undefined") return "-";
  const d = new Date(dateString);
  return isNaN(d.getTime())
    ? dateString
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeDate = (val: any): string | null => {
  if (!val && val !== 0) return null;

  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  if (val instanceof Date) return val.toISOString();

  if (typeof val === "object") {
    if (val.$date) {
      if (typeof val.$date === "string") {
        const d = new Date(val.$date);
        return isNaN(d.getTime()) ? val.$date : d.toISOString();
      }
      if (typeof val.$date === "object" && val.$date.$numberLong) {
        const millis = Number(val.$date.$numberLong);
        if (!Number.isNaN(millis)) return new Date(millis).toISOString();
      }
    }
    if (val.$numberLong) {
      const millis = Number(val.$numberLong);
      if (!Number.isNaN(millis)) return new Date(millis).toISOString();
    }
    const candidates = ["date", "created_at", "createdAt", "applied_date", "permission_date", "request_date", "timestamp"];
    for (const k of candidates) {
      if (val[k]) {
        const nd = normalizeDate(val[k]);
        if (nd) return nd;
      }
    }
  }
  return null;
};

const getStatusColor = (status?: string | null) => {
  if (!status) return "#fff";
  const s = status.toLowerCase();
  if (s === "approved" || s === "accepted") return "#00e676";
  if (s === "rejected") return "#ff5252";
  return "#ffeb3b";
};

// ------------------ COMPONENT ------------------
export default function AdminRequest() {
  const [mode, setMode] = useState<"requests" | "history">("requests");
  const [requestType, setRequestType] = useState<"leave" | "permission">("leave");
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState({ leaves: [], permissions: [] });
  const [history, setHistory] = useState({ leaves: [], permissions: [] });
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.exp) }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const attachDisplayDate = (arr: any[]) => {
    return arr.map((it: any) => {
      let raw: any = null;
      if (it.type?.toLowerCase() === "permission") {
        raw = it.date || it.permission_date || null;
      } else {
        raw = it.applied_date || it.created_at || it.request_date || null;
      }
      const normalized = normalizeDate(raw);
      return { ...it, _display_date: normalized };
    });
  };

  // ------------------ FETCH ------------------
  const fetchRequests = useCallback(async () => {
    try {
      if (!refreshing) setLoadingRequests(true);
      const res = await fetch(`${API_BASE_URL}/api/user/requests/`);
      if (!res.ok) {
        throw new Error(`Failed to fetch requests: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();

      const leaves = data.filter((r: any) => (r.type || r.request_type || "").toLowerCase() === "leave");
      const permissions = data.filter((r: any) => (r.type || r.request_type || "").toLowerCase() === "permission");

      setRequests({ leaves: attachDisplayDate(leaves), permissions: attachDisplayDate(permissions) });
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to fetch requests");
    } finally {
      setLoadingRequests(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const fetchHistory = useCallback(async () => {
    try {
      if (!refreshing) setLoadingHistory(true);
      const res = await fetch(`${API_BASE_URL}/api/request-history/`);
      if (!res.ok) {
        throw new Error(`Failed to fetch history: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();

      const leaves = data.filter((r: any) => (r.type || r.request_type || "").toLowerCase() === "leave");
      const permissions = data.filter((r: any) => (r.type || r.request_type || "").toLowerCase() === "permission");

      setHistory({ leaves: attachDisplayDate(leaves), permissions: attachDisplayDate(permissions) });
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to fetch history");
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchRequests();
    fetchHistory();
  }, [fetchRequests, fetchHistory]);

  // ------------------ HANDLE ACTION ------------------
  const handleAction = async (id: string, type: string, action: "approved" | "rejected" | "restore") => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/update-request-status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: id, request_type: type, status: action, leader_id: "admin" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `Server returned ${res.status}`);
      Alert.alert("Success", result.message || "Request updated");
      fetchRequests();
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to update request");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    mode === "requests" ? fetchRequests() : fetchHistory();
  };

  // ------------------ RENDER ------------------
  const renderItem = (item: any) => (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.cardSub}>{item.department || "-"}</Text>
      <Text style={styles.cardText}>Name: {item.user_name || item.user || "-"}</Text>

      {requestType === "leave" ? (
        <Text style={styles.cardText}>
          From: {formatDate(item.from_date)} → To: {formatDate(item.to_date)}
        </Text>
      ) : (
        <>
          <Text style={styles.cardText}>Time: {item.time || "-"}</Text>
          <Text style={styles.cardText}>Permission Type: {item.permission_type || "-"}</Text>
          <Text style={styles.cardText}>Duration: {item.duration_text || "-"}</Text>
          <Text style={styles.cardText}>Status: {item.status || "-"}</Text>
          <Text style={styles.cardText}>Permission Date: {formatDate(item._display_date)}</Text>
        </>
      )}

      <Text style={styles.cardText}>Reason: {item.reason || "-"}</Text>
      <Text style={styles.cardText}>Applied Date: {formatDate(item.created_at)}</Text>

      {mode === "history" && (
        <>
          <Text style={styles.cardText}>
            Status: <Text style={{ color: getStatusColor(item.status), fontWeight: "bold" }}>{item.status || "-"}</Text>
          </Text>
          <Text style={styles.cardText}>Action By: {item.action_by || "-"}</Text>
          <Text style={styles.cardText}>Action Date: {formatDate(item.action_at || item.action_date)}</Text>
          {item.status?.toLowerCase() !== "pending" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#ffeb3b", marginTop: 6 }]}
              onPress={() => handleAction(item.request_id, requestType, "restore")}
            >
              <Text style={styles.buttonText}>Restore</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {mode === "requests" && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.button, { backgroundColor: "#00e676" }]} onPress={() => handleAction(item.id, requestType, "approved")}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: "#ff5252" }]} onPress={() => handleAction(item.id, requestType, "rejected")}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  const dataToShow = mode === "requests"
    ? requests[requestType + "s"].filter((item) => (item.status || "").toLowerCase() === "pending")
    : history[requestType + "s"];

  const isLoading = mode === "requests" ? loadingRequests : loadingHistory;

  return (
    <LinearGradient colors={["#ec407a", "#641b9a"]} style={{ flex: 1 }}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.header}>Admin Requests</Text>

        {/* Mode Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, mode === "requests" && styles.activeTab]} onPress={() => setMode("requests")}>
            <Text style={styles.tabText}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, mode === "history" && styles.activeTab]} onPress={() => setMode("history")}>
            <Text style={styles.tabText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Type Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, requestType === "leave" && styles.activeTab]} onPress={() => setRequestType("leave")}>
            <Text style={styles.tabText}>Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, requestType === "permission" && styles.activeTab]} onPress={() => setRequestType("permission")}>
            <Text style={styles.tabText}>Permission</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ marginTop: 10, color: "#fff" }}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={dataToShow}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item }) => renderItem(item)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.noDataText}>No data found</Text>}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </Animated.View>
    </LinearGradient>
  );
}

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 50 },
  header: { textAlign: "center", fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 15 },
  tabContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 5 },
  activeTab: { backgroundColor: "rgba(255,255,255,0.5)" },
  tabText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  card: { backgroundColor: "rgba(255,255,255,0.2)", padding: 15, borderRadius: 10, marginBottom: 10 },
  cardSub: { fontSize: 14, color: "#fff", marginBottom: 6, fontWeight: "bold" },
  cardText: { fontSize: 14, marginBottom: 4, color: "#fff" },
  status: { fontSize: 14, fontWeight: "bold", marginTop: 6 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  button: { flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  noDataText: { color: "#fff", fontSize: 16, textAlign: "center", marginTop: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});