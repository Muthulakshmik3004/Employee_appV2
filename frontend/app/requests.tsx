import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

const Requests = () => {
  const [userData, setUserData] = useState(null);
  const [empId, setEmpId] = useState(null);
  const [role, setRole] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  const [activeTab, setActiveTab] = useState('Active');
  const [requestType, setRequestType] = useState('Permissions'); // NEW: Permissions | Leaves

  const [activePermissions, setActivePermissions] = useState([]);
  const [historyPermissions, setHistoryPermissions] = useState([]);
  const [activeLeaves, setActiveLeaves] = useState([]);
  const [historyLeaves, setHistoryLeaves] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user info & profile image
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const rawUser = await AsyncStorage.getItem('user');
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser);
          setUserData(parsedUser);
          setEmpId(parsedUser.emp_id);
          setRole(parsedUser.role);

          const savedImageUri = await AsyncStorage.getItem(`profileImageURI_${parsedUser.emp_id}`);
          if (savedImageUri) setProfileImage({ uri: savedImageUri });
        }
      } catch (err) {
        console.error('Failed to load user data', err);
      }
    };
    loadUserData();
  }, []);

  // Fetch requests when empId is loaded
  useEffect(() => {
    if (empId) {
      fetchPermissions();
      fetchLeaves();
    }
  }, [empId]);

  const fetchPermissions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const activeRes = await axios.get(`${API_BASE_URL}/api/permissions/active/${empId}/`, { headers });
      setActivePermissions(activeRes.data);

      const historyRes = await axios.get(`${API_BASE_URL}/api/permissions/history/${empId}/`, { headers });
      setHistoryPermissions(historyRes.data);

      console.log("Active Permissions:", activeRes.data);
      console.log("History Permissions:", historyRes.data);
    } catch (err) {
      console.error('Error fetching permissions:', err.response ? err.response.data : err.message);
      setError('Failed to fetch permissions');
    }
    setLoading(false);
  };

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const activeRes = await axios.get(`${API_BASE_URL}/api/leaves/active/${empId}/`, { headers });
      setActiveLeaves(activeRes.data);

      const historyRes = await axios.get(`${API_BASE_URL}/api/leaves/history/${empId}/`, { headers });
      setHistoryLeaves(historyRes.data);

      console.log("Active Leaves:", activeRes.data);
      console.log("History Leaves:", historyRes.data);
    } catch (err) {
      console.error('Error fetching leaves:', err.response ? err.response.data : err.message);
      setError('Failed to fetch leaves');
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemDate}>
          {new Date(item.created_at || item.from_date).toLocaleDateString()}
        </Text>
        {item.time && <Text style={styles.itemTime}>{item.time}</Text>}
      </View>

      {item.reason && <Text style={styles.itemReason}>{item.reason}</Text>}
      {item.from_date && item.to_date && (
        <Text style={styles.itemField}>
          {`From: ${new Date(item.from_date).toLocaleDateString()}  To: ${new Date(item.to_date).toLocaleDateString()}`}
        </Text>
      )}

      <Text
        style={[
          styles.itemStatus,
          item.status === 'Approved'
            ? styles.approved
            : item.status === 'Rejected'
            ? styles.rejected
            : styles.pending,
        ]}
      >
        {item.status}
      </Text>
    </View>
  );

  const currentData =
    requestType === 'Permissions'
      ? activeTab === 'Active'
        ? activePermissions
        : historyPermissions
      : activeTab === 'Active'
      ? activeLeaves
      : historyLeaves;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
      {profileImage && <Image source={profileImage} style={styles.profileImage} />}
      {userData && <Text style={styles.welcomeText}>Welcome, {userData.name}</Text>}

      <Text style={styles.title}>Requests</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Tabs for Request Type */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, requestType === 'Permissions' && styles.activeTab]}
          onPress={() => setRequestType('Permissions')}
        >
          <Text style={styles.tabText}>Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, requestType === 'Leaves' && styles.activeTab]}
          onPress={() => setRequestType('Leaves')}
        >
          <Text style={styles.tabText}>Leaves</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs for Active/History */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={styles.tabText}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'History' && styles.activeTab]}
          onPress={() => setActiveTab('History')}
        >
          <Text style={styles.tabText}>History</Text>
        </TouchableOpacity>
      </View>

      {currentData.length === 0 ? (
        <Text style={styles.noDataText}>No {activeTab} {requestType} requests</Text>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()} // ✅ FIXED unique key warning
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  profileImage: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 10 },
  welcomeText: { color: 'white', fontSize: 18, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 35, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center', fontFamily: 'serif' },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 5 },
  activeTab: { backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  tabText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  list: { flex: 1 },
  itemContainer: { backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 15, borderRadius: 10, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  itemDate: { color: 'white', fontSize: 14 },
  itemTime: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  itemReason: { color: 'white', fontSize: 14, marginVertical: 5 },
  itemField: { color: 'white', fontSize: 14, marginVertical: 2 },
  itemStatus: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
  approved: { color: 'green' },
  rejected: { color: 'red' },
  pending: { color: 'yellow' },
  noDataText: { color: 'white', fontSize: 16, textAlign: 'center', marginTop: 20 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
});

export default Requests;
