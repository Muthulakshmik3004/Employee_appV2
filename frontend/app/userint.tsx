import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import API_BASE_URL from "../config";

const UserManagement = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [removedUsers, setRemovedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("active");

  const fetchData = async (selectedTab, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      if (selectedTab === "active") {
        const res = await axios.get(`${API_BASE_URL}/api/users/`);
        setActiveUsers(res.data.users || []);
      } else {
        const res = await axios.get(`${API_BASE_URL}/api/removed_users/`);
        setRemovedUsers(res.data.removed_users || []);
      }
    } catch (err) {
      console.error("❌ Error fetching data:", err);
    }
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  };

  useEffect(() => {
    fetchData(tab);
  }, [tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(tab, true);
  };

  // ⭐ RESTORE USER API CALL
  const handleRestoreUser = async (user) => {
    try {
      await axios.post(`${API_BASE_URL}/api/restore_user/`, {
        emp_id: user.emp_id,
      });

      fetchData("removed");
      fetchData("active");
    } catch (err) {
      console.error("❌ Error restoring user:", err.response?.data || err.message);
    }
  };

  // ⭐ REMOVE USER API CALL
  const handleRemoveUser = async (user) => {
    try {
      await axios.post(`${API_BASE_URL}/api/remove_user/`, {
        emp_id: user.emp_id,
        removed_by: "Admin",
      });
      fetchData("active");
      fetchData("removed");
    } catch (err) {
      console.error("❌ Error removing user:", err.response?.data || err.message);
    }
  };

  return (
    <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === "active" && styles.activeTab]}
          onPress={() => setTab("active")}
        >
          <Text style={[styles.tabText, tab === "active" && styles.activeTabText]}>
            Active Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === "removed" && styles.activeTab]}
          onPress={() => setTab("removed")}
        >
          <Text style={[styles.tabText, tab === "removed" && styles.activeTabText]}>
            Removed Users
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* ACTIVE USERS */}
          {tab === "active" && activeUsers.length === 0 && (
            <Text style={styles.noDataText}>No active users found</Text>
          )}

          {tab === "active" &&
            activeUsers.map((user) => (
              <View key={user.id} style={styles.card}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.detail}>ID: {user.emp_id}</Text>
                <Text style={styles.detail}>Email: {user.email}</Text>
                <Text style={styles.detail}>Role: {user.role}</Text>
                <Text style={styles.detail}>Department: {user.department}</Text>

                {/* Remove Button */}
                <TouchableOpacity onPress={() => handleRemoveUser(user)}>
                  <LinearGradient colors={["#f48fb1", "#c2185b"]} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}

          {/* REMOVED USERS */}
          {tab === "removed" && removedUsers.length === 0 && (
            <Text style={styles.noDataText}>No removed users found</Text>
          )}

          {tab === "removed" &&
            removedUsers.map((user) => (
              <View key={user.id} style={styles.card}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.detail}>ID: {user.emp_id}</Text>
                <Text style={styles.detail}>Email: {user.email}</Text>
                <Text style={styles.detail}>Role: {user.role}</Text>
                <Text style={styles.detail}>Department: {user.department}</Text>

                <Text style={styles.removed}>
                  ❌ Removed by {user.removed_by} at {user.removed_at}
                </Text>

                {/* ⭐ NEW RESTORE BUTTON - Theme Match */}
                <TouchableOpacity onPress={() => handleRestoreUser(user)}>
                  <LinearGradient colors={["#ff80ab", "#c2185b"]} style={styles.restoreBtn}>
                    <Text style={styles.restoreBtnText}>Restore</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },

  tabContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },

  tab: { flex: 1, padding: 10, alignItems: "center", borderRadius: 8 },

  activeTab: { backgroundColor: "#c2185b" },

  tabText: { fontSize: 16, fontWeight: "bold", color: "#fff" },

  activeTabText: { color: "#fff" },

  card: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  name: { fontSize: 18, fontWeight: "bold", color: "white" },

  detail: { fontSize: 14, color: "white", marginVertical: 2 },

  removed: { marginTop: 5, fontSize: 13, fontStyle: "italic", color: "#f8bbd0" },

  removeBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
  },

  removeBtnText: { color: "white", fontWeight: "bold", fontSize: 15 },

  restoreBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },

  restoreBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    color: "white",
  },
});

export default UserManagement;
