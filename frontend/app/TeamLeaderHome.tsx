import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config";


// const API_BASE_URL = "http://192.168.1.183:8000";


const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusColor = (status) => {
  if (!status) return "#fff";
  const s = status.toLowerCase();
  if (s === "accepted" || s === "approved") return "#00e676";
  if (s === "rejected") return "#ff5252";
  return "#ffeb3b";
};

export default function TeamLeaderDashboard() {
  const [mode, setMode] = useState("requests");
  const [requestType, setRequestType] = useState("leave");
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState({ leaves: [], permissions: [] });
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [history, setHistory] = useState({ leaves: [], permissions: [] });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ Fetch Profile Picture
  const fetchProfilePicture = useCallback(async () => {
    try {
      const leaderId = await AsyncStorage.getItem("empId");
      if (!leaderId) {
        Alert.alert("Error", "No Team Leader ID found");
        setProfileLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/teamleader/${leaderId}/profile/`);
      if (!response.ok) throw new Error("Failed to fetch profile image");

      const data = await response.json();
      setUserData(data);
      if (data.image) {
        setProfileImage(data.image);
      } else {
        setProfileImage("https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      setProfileImage("https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      if (!refreshing) setRequestsLoading(true);
      const leaderId = await AsyncStorage.getItem("empId");
      if (!leaderId) {
        Alert.alert("Error", "No Team Leader ID found");
        setRequestsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/teamleader/${leaderId}/requests/`);
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      const data = await response.json();
      setRequests({ leaves: data.leaves || [], permissions: data.permissions || [] });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    } finally {
      setRequestsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const fetchHistory = useCallback(async () => {
    try {
      if (!refreshing) setHistoryLoading(true);
      const leaderId = await AsyncStorage.getItem("empId");
      if (!leaderId) {
        Alert.alert("Error", "No Team Leader ID found");
        setHistoryLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/teamleader/${leaderId}/history/`);
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      const data = await response.json();
      const leaves = (data.history || []).filter((i) => i.request_type === "leave");
      const permissions = (data.history || []).filter((i) => i.request_type === "permission");
      setHistory({ leaves, permissions });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchProfilePicture();
    fetchRequests();
    fetchHistory();
  }, [fetchProfilePicture, fetchRequests, fetchHistory]);

  const handleAction = async (id, type, action) => {
    try {
      const leaderId = await AsyncStorage.getItem("empId");
      const response = await fetch(`${API_BASE_URL}/api/tlupdate-request-status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: id, request_type: type, status: action, leader_id: leaderId }),
      });
      if (!response.ok) throw new Error("Failed to update request");
      const result = await response.json();
      Alert.alert("Success", result.message);
      fetchRequests();
      fetchHistory();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfilePicture();
    if (mode === "requests") fetchRequests();
    else fetchHistory();
  };

  const renderLeaveItem = ({ item }) => (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.cardSub}>{item.department}</Text>
      <Text style={styles.cardText}>Name: {item.user_name}</Text>
      {mode === "history" && (
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
      )}
      <Text style={styles.cardText}>
        From: {formatDate(item.from_date)} → To: {formatDate(item.to_date)}
      </Text>
      <Text style={styles.cardText}>Reason: {item.reason || "-"}</Text>
      <Text style={styles.cardText}>Applied Date: {item.applied_date}</Text>
      {mode === "history" && (
        <>
          <Text style={styles.cardText}>Action By: {item.action_by || "-"}</Text>
          <Text style={styles.cardText}>Action At: {formatDate(item.action_at)}</Text>
        </>
      )}
      {mode === "requests" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#00e676" }]}
            onPress={() => handleAction(item.id, "leave", "accepted")}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ff5252" }]}
            onPress={() => handleAction(item.id, "leave", "rejected")}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  const renderPermissionItem = ({ item }) => (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.cardSub}>{item.department}</Text>
      <Text style={styles.cardText}>Name: {item.user_name}</Text>
      {mode === "history" && (
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
      )}
      <Text style={styles.cardText}>Reason: {item.reason || "-"}</Text>
      <Text style={styles.cardText}>Permission Type: {item.permission_type || "-"}</Text>
      <Text style={styles.cardText}>Time: {item.time || "-"}</Text>
      <Text style={styles.cardText}>Duration: {item.duration_text || "-"}</Text>
      <Text style={styles.cardText}>Applied Date: {item.applied_date}</Text>
      {mode === "history" && (
        <>
          <Text style={styles.cardText}>Action By: {item.action_by || "-"}</Text>
          <Text style={styles.cardText}>Action At: {formatDate(item.action_at)}</Text>
        </>
      )}
      {mode === "requests" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#00e676" }]}
            onPress={() => handleAction(item.id, "permission", "accepted")}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ff5252" }]}
            onPress={() => handleAction(item.id, "permission", "rejected")}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  const isLoading =
    (mode === "requests" && requestsLoading) || (mode === "history" && historyLoading);

  if (isLoading || profileLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ marginTop: 10, color: "#fff" }}>Loading...</Text>
      </View>
    );

  let dataToShow = [];
  let renderItem = renderLeaveItem;
if (mode === "requests") {
  // ✅ Show only pending items in Active tab
  const allData =
    requestType === "leave" ? requests.leaves : requests.permissions;
 dataToShow = allData.filter(
  (item) => (item.status || "").toLowerCase() === "pending"
);

  renderItem =
    requestType === "leave" ? renderLeaveItem : renderPermissionItem;
} else {
  dataToShow =
    requestType === "leave" ? history.leaves : history.permissions;
  renderItem =
    requestType === "leave" ? renderLeaveItem : renderPermissionItem;
}

  return (
    <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.gradient}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.profileContainer}>
          <Image
            source={{
              uri: profileImage || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.profileImage}
          />
          {userData && <Text style={styles.welcomeText}>Welcome, {userData.name}</Text>}
        </View>

        <Text style={styles.header}>Team Leader Dashboard</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, mode === "requests" && styles.activeTab]}
            onPress={() => setMode("requests")}
          >
            <Text style={styles.tabText}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "history" && styles.activeTab]}
            onPress={() => setMode("history")}
          >
            <Text style={styles.tabText}>History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, requestType === "leave" && styles.activeTab]}
            onPress={() => setRequestType("leave")}
          >
            <Text style={styles.tabText}>Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, requestType === "permission" && styles.activeTab]}
            onPress={() => setRequestType("permission")}
          >
            <Text style={styles.tabText}>Permission</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={dataToShow}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.noDataText}>No data found</Text>}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 15,
    paddingTop: 50,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#ec407a",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  header: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  tabText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardSub: { fontSize: 14, color: "#fff", marginBottom: 6, fontWeight: "bold" },
  cardText: { fontSize: 14, marginBottom: 4, color: "#fff" },
  status: { fontSize: 14, fontWeight: "bold" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  button: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  noDataText: { color: "#fff", fontSize: 16, textAlign: "center", marginTop: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});