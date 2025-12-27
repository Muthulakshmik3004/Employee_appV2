// PunchPage.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config';

const OFFICE_COORDS = {
  latitude: 8.7901247,
  longitude: 78.1150205,
}
const CLIENT_COORDS = {
  latitude: 8.7901247, // replace with real client coordinates
  longitude: 78.1150205,
};

const DISTANCE_LIMIT_M = 25;

const API = axios.create({
  baseURL: `${API_BASE_URL}`,
  timeout: 10000,
});

function getDistanceInMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const c = 2 * Math.asin(
    Math.sqrt(
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
    )
  );
  return R * c;
}

function isOnOrBeforeTwelveAM(now = new Date()) {
  const Twelve = new Date(now);
  Twelve.setHours(13, 0, 0, 0); // 9:00 AM
  return now.getTime() <= Twelve.getTime();
}


const postPunchToServer = async (endpoint: string, payload: any) => {
  try {
    const res = await API.post(endpoint, payload);
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (typeof data === 'string') throw new Error(data);
      if (data.error) throw new Error(data.error);
      if (data.detail) throw new Error(data.detail);
      throw new Error(JSON.stringify(data));
    }
    if (err.message) throw new Error(err.message);
    throw new Error('Network error');
  }
};

type LoadingKey =
  | 'punch-in'
  | 'punch-out'
  | 'onsite-in'
  | 'onsite-out'
  | 'lunch-in'
  | 'lunch-out'
  | 'tea-in'
  | 'tea-out'
  | 'fresh-in'
  | 'fresh-out'
  | 'site-office-logout'
  | 'site-client-login'
  | 'site-client-logout'
  | 'site-office-login'
  | 'site-refresh'
  | 'OT'
  | 'Others'
  | null;



const BREAK_ENDPOINTS: Record<'lunch' | 'tea' | 'fresh', { in: string; out: string }> = {
  lunch: { in: '/api/lunch/in/', out: '/api/lunch/out/' },
  tea: { in: '/api/tea/in/', out: '/api/tea/out/' },
  fresh: { in: '/api/freshup/in/', out: '/api/freshup/out/' },
};

type SiteStage =
  | 'idle' // initial, before starting site flow
  | 'office-logout' // show "Log out from Office"
  | 'client-login' // show "Log in on Client"
  | 'client-logout' // show "Log out from Client"
  | 'office-login' // show "Log in Office"
  | 'completed';

const PunchPage = () => {
  const router = useRouter();
  const [showInOutButtons, setShowInOutButtons] = useState({
    punch: false,
    onsite: false,
    lunch: false,
    teaTime: false,
    freshUp: false,
  });

  const [loadingKey, setLoadingKey] = useState<LoadingKey>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Site specific
  const [siteStage, setSiteStage] = useState<SiteStage>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          setCurrentUser(JSON.parse(userJson));
        }
        // also try to restore session id if mid-flow
        const sid = await AsyncStorage.getItem('site_session_id');
        if (sid) {
          setCurrentSessionId(sid);
          // infer stage if stored
          const storedStage = (await AsyncStorage.getItem('site_stage')) as SiteStage | null;
          if (storedStage) setSiteStage(storedStage);
        }
      } catch (err) {
        console.error('Failed to load user or session', err);
      }
    };
    fetchUser();
  }, []);

  const handlePermissionClick = () => router.push('/permission');
  const handleOnsiteInTimeClick = () => router.push('/onsite');
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [reason, setReason] = useState('');

  const clearSiteSession = async () => {
  try {
    await AsyncStorage.removeItem('site_session_id');
    await AsyncStorage.removeItem('site_stage');
    setCurrentSessionId(null);
    setSiteStage('idle'); // reset to initial state
    setReason('');         // reset reason input
    Alert.alert('Session cleared', 'The session was removed and local state reset.');
  } catch (err) {
    console.error('Failed to clear session', err);
  }
};



  const handleLogoutPress = () => {
  setShowReasonBox(true);
  };


 const handleSubmitLogout = async () => {
  if (loadingKey) return; // prevent double tap

  if (!reason.trim()) {
    Alert.alert('Error', 'Please enter a reason for Office Logout.');
    return;
  }

  if (!currentUser) {
    Alert.alert('Error', 'User not loaded.');
    return;
  }

  try {
    setLoadingKey('site-office-logout');

    const { userCoords, distance } = await ensureLocation(OFFICE_COORDS);

    const resp = await sendSiteEventToServer(
      'office_logout',
      userCoords,
      distance,
      undefined, // no sessionId yet
      reason      // pass correct reason
    );

    const sid = resp?.session_id;
    if (!sid) throw new Error('No session id returned from server.');

    setCurrentSessionId(sid);
    await persistSiteState('client-login', sid);
    setSiteStage('client-login');

    Alert.alert('Success', 'Logged out from office successfully.');

    // reset reason UI
    setShowReasonBox(false);
    setReason('');
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed to log out from office.');
  } finally {
    setLoadingKey(null);
  }
};


const refreshSiteSession = async () => {
  if (!currentSessionId) {
    Alert.alert('No session', 'No active session to refresh.');
    return;
  }

  try {
    setLoadingKey('site-refresh');
    const resp = await axios.get(`${API_BASE_URL}/api/site/session/${currentSessionId}/`);
    
    if (!resp.data.success) {
      throw new Error(resp.data.error || 'Failed to refresh session.');
    }

    const session = resp.data.session;
    

    // Update frontend state
    setSiteStage(determineStageFromSession(session));
    setCurrentSessionId(session.session_id);

    Alert.alert('Session Refreshed', 'Your session data has been updated.');
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed to refresh session.');
  } finally {
    setLoadingKey(null);
  }
};

// Helper to infer stage based on session data
const determineStageFromSession = (session: any): SiteStage => {
  if (!session.office_logout_time) return 'office-logout';
  if (!session.client_login_time) return 'client-login';
  if (!session.client_logout_time) return 'client-logout';
  if (!session.office_login_time) return 'office-login';
  return 'completed';
};





  const ensureLocation = async (targetCoords: { latitude: number; longitude: number }) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Please enable location permission to continue.');
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true,
    });

    const userCoords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    const distance = getDistanceInMeters(userCoords, targetCoords);



    return { userCoords, distance };
  };

  // ===================== PUNCH (kept as-is) =====================
  const handleSimpleInTimeClick = async (key: Exclude<LoadingKey, null>) => {
    if (!currentUser) {
      Alert.alert('Error', 'User not loaded.');
      return;
    }

    try {
      setLoadingKey(key);

      const { userCoords, distance } = await ensureLocation(OFFICE_COORDS);

      const now = new Date();
      if (!isOnOrBeforeTwelveAM(now)) {
        Alert.alert('Late Punch-in Not Allowed', 'Current time is after 12:00 AM.');
        return;
      }

      const payload = {
        user_id: currentUser.emp_id,
        user_name: currentUser.name,
        user_email: currentUser.gmail,
        punch_type: 'in',
        timestamp: now.toISOString(),
        coords: userCoords,
        office_coords: OFFICE_COORDS,
        distance_m: Math.round(distance),
        device_tz_offset_min: now.getTimezoneOffset() * -1,
        reason: reason, 
        
      };

      await postPunchToServer('/api/punchin/', payload);
      Alert.alert('Success', 'In Time recorded successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong while punching in.');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleSimpleOutTimeClick = async (key: Exclude<LoadingKey, null>) => {
    if (!currentUser) {
      Alert.alert('Error', 'User not loaded.');
      return;
    }

    try {
      setLoadingKey(key);

      const { userCoords, distance } = await ensureLocation(OFFICE_COORDS);

      const now = new Date();
        // Check if current time is after 7 PM
    const sevenPM = new Date(now);
    sevenPM.setHours(19, 0, 0, 0); // 19:00:00 = 7 PM

    if (now < sevenPM) {
      Alert.alert(
        'Cannot Punch Out',
        'You can only punch out after 7:00 PM.'
      );
      return; // stop function
    }
      const payload = {
        user_id: currentUser.emp_id,
        user_name: currentUser.name,
        user_email: currentUser.gmail,
        punch_type: 'out',
        timestamp: now.toISOString(),
        coords: userCoords,
        office_coords: OFFICE_COORDS,
        distance_m: Math.round(distance),
        device_tz_offset_min: now.getTimezoneOffset() * -1,
        reason: reason,
      };

      await postPunchToServer('/api/punchout/', payload);
      Alert.alert('Success', 'Out Time recorded successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong while punching out.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ===================== BREAKS (Lunch / Tea / Fresh Up) =====================
  type BreakKind = 'lunch' | 'tea' | 'fresh';

  const handleBreakIn = async (
    key: Exclude<LoadingKey, null>,
    kind: BreakKind
  ) => {
    if (!currentUser) {
      Alert.alert('Error', 'User not loaded.');
      return;
    }
    try {
      setLoadingKey(key);

      const { userCoords, distance } = await ensureLocation(OFFICE_COORDS);

      const now = new Date();
      const payload = {
        user_id: currentUser.emp_id,
        user_name: currentUser.name,
        user_email: currentUser.gmail,
        break_kind: kind,
        event: 'in',
        timestamp: now.toISOString(),
        coords: userCoords,
        office_coords: OFFICE_COORDS,
        distance_m: Math.round(distance),
        device_tz_offset_min: now.getTimezoneOffset() * -1,
        reason: reason,
      };

      await postPunchToServer(BREAK_ENDPOINTS[kind].in, payload);
      Alert.alert('Success', `${kind === 'fresh' ? 'Fresh Up' : kind.charAt(0).toUpperCase() + kind.slice(1)} In recorded successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong while recording in time.');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleBreakOut = async (
    key: Exclude<LoadingKey, null>,
    kind: BreakKind
  ) => {
    if (!currentUser) {
      Alert.alert('Error', 'User not loaded.');
      return;
    }
    try {
      setLoadingKey(key);

      const { userCoords, distance } = await ensureLocation(OFFICE_COORDS);

      const now = new Date();
      const payload = {
        user_id: currentUser.emp_id,
        user_name: currentUser.name,
        user_email: currentUser.gmail,
        break_kind: kind,
        event: 'out',
        timestamp: now.toISOString(),
        coords: userCoords,
        office_coords: OFFICE_COORDS,
        distance_m: Math.round(distance),
        device_tz_offset_min: now.getTimezoneOffset() * -1,
        reason: reason,
        
      };
      console.log('Break Out Payload:', payload);
    

      await postPunchToServer(BREAK_ENDPOINTS[kind].out, payload);
      Alert.alert('Success', `${kind === 'fresh' ? 'Fresh Up' : kind.charAt(0).toUpperCase() + kind.slice(1)} Out recorded successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong while recording out time.');
    } finally {
      setLoadingKey(null);
    }
  };

  // ===================== SITE FLOW (NEW) =====================
  // siteStage controls UI. We persist stage and session id to AsyncStorage to survive app restarts.

  // ---------- Persist Site State ----------
const persistSiteState = async (stage: SiteStage, sessionId: string | null) => {
  try {
    if (sessionId) {
      await AsyncStorage.setItem('site_session_id', sessionId);
    } else {
      await AsyncStorage.removeItem('site_session_id');
    }

    if (stage) {
      await AsyncStorage.setItem('site_stage', stage);
    } else {
      await AsyncStorage.removeItem('site_stage');
    }
  } catch (err) {
    console.warn('Failed to persist site state', err);
  }
};

// ---------- Send Site Event to Server ----------
const sendSiteEventToServer = async (
  eventName: 'office_logout' | 'client_login' | 'client_logout' | 'office_login',
  coords: { latitude: number; longitude: number },
  distance_m: number,
  sessionId?: string,
  reasonText?: string
) => {
  if (!currentUser) throw new Error('User not loaded.');

  const now = new Date();
  const payload: any = {
    user_id: currentUser.emp_id,
    user_name: currentUser.name,
    user_email: currentUser.gmail,
    event: eventName,
    timestamp: now.toISOString(),
    coords,
    distance_m: Math.round(distance_m),
    device_tz_offset_min: now.getTimezoneOffset() * -1,
  };

  // Include session_id for every event except the very first one
  if (sessionId) payload.session_id = sessionId;

  // Add reason only for office_logout
  if (eventName === 'office_logout' && reasonText) payload.reason = reasonText;

  console.log('Site Event Payload:', payload);

  const resp = await postPunchToServer('/api/site/session/event/', payload);
  return resp; // expected { success: true, session_id: <id>, session: {...} }
};

// ---------- Site Start Handler ----------
const handleSiteStart = async () => {
  setSiteStage('office-logout');
  await persistSiteState('office-logout', currentSessionId);
};

// ---------- Office Logout Handler ----------
// ✅ handleOfficeLogout – single source of truth for API call
const handleOfficeLogout = async (logoutReason) => {
  if (!currentUser) return Alert.alert('Error', 'User not loaded.');

  try {
    if (loadingKey) return; // prevent double press
    setLoadingKey('site-office-logout');

    const { userCoords, distance } = await ensureLocation(OFFICE_COORDS);

    Alert.alert(
      'Location Fetched',
      `Lat: ${userCoords.latitude.toFixed(6)}, Lon: ${userCoords.longitude.toFixed(6)}\nDistance: ${distance.toFixed(2)}m`
    );

    // ✅ Only this function calls the backend once
    const resp = await sendSiteEventToServer(
      'office_logout',
      userCoords,
      distance,
      currentSessionId, // null if first time
      logoutReason
    );

    const sid = resp?.session_id;
    if (!sid) throw new Error('No session id returned from server.');

    setCurrentSessionId(sid);
    await persistSiteState('client-login', sid);
    setSiteStage('client-login');

    Alert.alert('Success', 'Logged out from office and session started.');

    // Reset UI
    setReason('');
    setShowReasonBox(false);
  } catch (err) {
    Alert.alert('Error', err?.message || 'Failed to log out from office.');
  } finally {
    setLoadingKey(null);
  }
};

// ---------- Client Login Handler ----------
const handleClientLogin = async () => {
  if (!currentUser) return Alert.alert('Error', 'User not loaded.');
  if (!currentSessionId) return Alert.alert('Error', 'Session not found. Please log out from office first.');

  try {
    setLoadingKey('site-client-login');
    const { userCoords, distance } = await ensureLocation(CLIENT_COORDS);

    await sendSiteEventToServer(
      'client_login',
      userCoords,
      distance,
      currentSessionId
    );

    await persistSiteState('client-logout', currentSessionId);
    setSiteStage('client-logout');
    Alert.alert('Success', 'Logged in to client.');
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed to log in to client.');
  } finally {
    setLoadingKey(null);
  }
};

// ---------- Client Logout Handler ----------
const handleClientLogout = async () => {
  if (!currentUser) return Alert.alert('Error', 'User not loaded.');
  if (!currentSessionId) return Alert.alert('Error', 'Session not found. Please log out from office first.');

  try {
    setLoadingKey('site-client-logout');
    const { userCoords, distance } = await ensureLocation(CLIENT_COORDS);

    await sendSiteEventToServer(
      'client_logout',
      userCoords,
      distance,
      currentSessionId
    );

    await persistSiteState('office-login', currentSessionId);
    setSiteStage('office-login');
    Alert.alert('Success', 'Logged out from client.');
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed to log out from client.');
  } finally {
    setLoadingKey(null);
  }
};

// ---------- Office Login Handler ----------
const handleOfficeLogin = async () => {
  if (!currentUser) return Alert.alert('Error', 'User not loaded.');
  if (!currentSessionId) return Alert.alert('Error', 'Session not found. Please start session by logging out from office first.');

  try {
    setLoadingKey('site-office-login');
    const { userCoords, distance } = await ensureLocation(OFFICE_COORDS);

    await sendSiteEventToServer(
      'office_login',
      userCoords,
      distance,
      currentSessionId
    );

    // Complete session and clear data
    await persistSiteState('completed', null);
    setSiteStage('completed');
    setCurrentSessionId(null);
    await AsyncStorage.removeItem('site_session_id');
    await AsyncStorage.removeItem('site_stage');

    Alert.alert('Success', 'Logged in to office. Session completed.');
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed to log in to office.');
  } finally {
    setLoadingKey(null);
  }
};


  // Toggle show
  const handleButtonClick = (button: keyof typeof showInOutButtons) => {
    setShowInOutButtons((prev) => ({
      ...{ punch: false, onsite: false, lunch: false, teaTime: false, freshUp: false },
      [button]: !prev[button],
    }));
  };

  return (
    <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
      <Text style={styles.title}>Punch Page</Text>

      {/* Punch */}
      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/punch10.png')} style={styles.icon} />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleButtonClick('punch')}
          disabled={loadingKey !== null}
        >
          <Text style={styles.buttonText}>Punch</Text>
        </TouchableOpacity>
      </View>

      {showInOutButtons.punch && (
        <View style={styles.permissionButtonsContainer}>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleSimpleInTimeClick('punch-in')}
            disabled={loadingKey === 'punch-in'}
          >
            {loadingKey === 'punch-in' ? <ActivityIndicator /> : <Text style={styles.buttonText}>In Time</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleSimpleOutTimeClick('punch-out')}
            disabled={loadingKey === 'punch-out'}
          >
            {loadingKey === 'punch-out' ? <ActivityIndicator /> : <Text style={styles.buttonText}>Out Time</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Permission */}
      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/permission.png')} style={styles.icon} />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePermissionClick}
          disabled={loadingKey !== null}
        >
          <Text style={styles.buttonText}>Permission</Text>
        </TouchableOpacity>
      </View>

      {/* Site (onsite client flow) */}
      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/onsite.png')} style={styles.icon} />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            // toggle the onsite buttons (we keep same key as before)
            handleButtonClick('onsite');
            // if opening for first time and idle, set stage to office-logout so user sees first button
            if (siteStage === 'idle' && !showInOutButtons.onsite) {
              setTimeout(() => { // small delay after UI toggle
                setSiteStage('office-logout');
                persistSiteState('office-logout', currentSessionId).catch(() => {});
              }, 50);
            }
          }}
          disabled={loadingKey !== null}
        >
          <Text style={styles.buttonText}>Site</Text>
        </TouchableOpacity>
      </View>

      {showInOutButtons.onsite && (
        <View style={styles.permissionButtonsContainer}>
          {/* Render different buttons depending on siteStage */}
          {siteStage === 'office-logout' && !showReasonBox && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleLogoutPress}
              disabled={loadingKey === 'site-office-logout'}
            >
              {loadingKey === 'site-office-logout' ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Log out from Office</Text>
              )}
            </TouchableOpacity>
          )}

          {showReasonBox && (
            <View style={styles.reasonContainer}>
              <Text style={styles.label}>Site Location..</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Enter your reason..."
                value={reason}
                onChangeText={setReason}
                multiline
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitLogout}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}

          {siteStage === 'client-login' && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleClientLogin}
              disabled={loadingKey === 'site-client-login'}
            >
              {loadingKey === 'site-client-login' ? <ActivityIndicator /> : <Text style={styles.buttonText}>Log in on Client</Text>}
            </TouchableOpacity>
          )}

          {siteStage === 'client-logout' && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleClientLogout}
              disabled={loadingKey === 'site-client-logout'}
            >
              {loadingKey === 'site-client-logout' ? <ActivityIndicator /> : <Text style={styles.buttonText}>Log out from Client</Text>}
            </TouchableOpacity>
          )}

          {siteStage === 'office-login' && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleOfficeLogin}
              disabled={loadingKey === 'site-office-login'}
            >
              {loadingKey === 'site-office-login' ? <ActivityIndicator /> : <Text style={styles.buttonText}>Log in Office</Text>}
            </TouchableOpacity>
          )}

          {siteStage === 'completed' && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => {
                Alert.alert('Info', 'Site session already completed. To start a new session, press Log out from Office again.');
                // reset to allow new session
                setSiteStage('office-logout');
              }}
            >
              <Text style={styles.buttonText}>Session Completed — Start New</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshSiteSession}
            disabled={loadingKey === 'site-refresh'}
          >
            <Text style={styles.refreshText}>
              {loadingKey === 'site-refresh' ? 'Refreshing...' : 'Refresh Session'}
            </Text>
          </TouchableOpacity>

         


        </View>
      )}

      {/* Lunch */}
      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/lunch.png')} style={styles.icon} />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleButtonClick('lunch')}
          disabled={loadingKey !== null}
        >
          <Text style={styles.buttonText}>Lunch</Text>
        </TouchableOpacity>
      </View>

      {showInOutButtons.lunch && (
        <View style={styles.permissionButtonsContainer}>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleBreakIn('lunch-in', 'lunch')}
            disabled={loadingKey === 'lunch-in'}
          >
            {loadingKey === 'lunch-in' ? <ActivityIndicator /> : <Text style={styles.buttonText}>In Time</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleBreakOut('lunch-out', 'lunch')}
            disabled={loadingKey === 'lunch-out'}
          >
            {loadingKey === 'lunch-out' ? <ActivityIndicator /> : <Text style={styles.buttonText}>Out Time</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Tea Time */}
      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/tea time.png')} style={styles.icon} />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleButtonClick('teaTime')}
          disabled={loadingKey !== null}
        >
          <Text style={styles.buttonText}>Tea Time</Text>
        </TouchableOpacity>
      </View>

      {showInOutButtons.teaTime && (
        <View style={styles.permissionButtonsContainer}>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleBreakIn('tea-in', 'tea')}
            disabled={loadingKey === 'tea-in'}
          >
            {loadingKey === 'tea-in' ? <ActivityIndicator /> : <Text style={styles.buttonText}>In Time</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleBreakOut('tea-out', 'tea')}
            disabled={loadingKey === 'tea-out'}
          >
            {loadingKey === 'tea-out' ? <ActivityIndicator /> : <Text style={styles.buttonText}>Out Time</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Fresh Up */}
      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/fresh up.png')} style={styles.icon} />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleButtonClick('freshUp')}
          disabled={loadingKey !== null}
        >
          <Text style={styles.buttonText}>Fresh Up Time</Text>
        </TouchableOpacity>
      </View>

      {showInOutButtons.freshUp && (
        <View style={styles.permissionButtonsContainer}>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleBreakIn('fresh-in', 'fresh')}
            disabled={loadingKey === 'fresh-in'}
          >
            {loadingKey === 'fresh-in' ? <ActivityIndicator /> : <Text style={styles.buttonText}>In Time</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleBreakOut('fresh-out', 'fresh')}
            disabled={loadingKey === 'fresh-out'}
          >
            {loadingKey === 'fresh-out' ? <ActivityIndicator /> : <Text style={styles.buttonText}>Out Time</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loadingKey !== null}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: 'serif',
  },refreshButton: {
    backgroundColor: '#FF6B81', // pink/red theme
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // for Android shadow
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -25,
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: { width: 39, height: 44 },
  button: {
    flex: 1,
    paddingVertical: 15,
    paddingRight: 20,
    paddingLeft: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  permissionButtonsContainer: {
    flexDirection: 'row',           // ✅ row layout
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  permissionButton: {
    flex: 1,                         // ✅ equal width
    marginHorizontal: 5,             // ✅ spacing between buttons
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reasonContainer: {
  width: '80%',
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderRadius: 15,
  padding: 15,
  marginBottom: 20,
},
label: {
  color: 'white',
  fontSize: 16,
  marginBottom: 8,
  fontWeight: 'bold',
},
reasonInput: {
  backgroundColor: 'rgba(255,255,255,0.9)',
  borderRadius: 10,
  padding: 10,
  fontSize: 16,
  minHeight: 60,
  textAlignVertical: 'top',
  marginBottom: 10,
},
submitButton: {
  backgroundColor: '#ec407a',
  borderRadius: 10,
  paddingVertical: 10,
  alignItems: 'center',
},
submitText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
},

  backButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});


export default PunchPage;
