import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

import API_BASE_URL from "../config";

const ProfileView: React.FC = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<{ uri: string } | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [empId, setEmpId] = useState<string | null>(null);

  // 🔹 Load empId from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const empIdFromLogin = await AsyncStorage.getItem("empId");
        if (!empIdFromLogin) {
          console.warn("No empId found in storage");
          return;
        }
        setEmpId(empIdFromLogin);
        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/teamleader/${empIdFromLogin}/`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        if (data.status) delete data.status;
        setUserData(data);
        if (data.image) setProfileImage({ uri: data.image });
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // 🔹 Save profile image
  const handleSaveImage = async () => {
    if (!empId) return;
    try {
      const imageUri = profileImage?.uri || null;
      const response = await fetch(`${API_BASE_URL}/api/teamleader/${empId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUri }),
      });

      if (!response.ok) throw new Error("Failed to save profile image");
      Alert.alert("Success", "Profile image saved successfully.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save profile image.");
    }
  };

  // 🔹 Delete profile image
  const handleDeleteImage = () => {
    setModalVisible(false);
    Alert.alert("Delete Image", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          setProfileImage(null);
          if (empId) {
            await fetch(`${API_BASE_URL}/api/teamleader/${empId}/`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: null }),
            });
          }
        },
      },
    ]);
  };

  // 🔹 Change profile image
  const handleChangeImage = async () => {
    setModalVisible(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newUri =
        FileSystem.documentDirectory + result.assets[0].uri.split("/").pop();
      try {
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: newUri,
        });
        setProfileImage({ uri: newUri });
      } catch (error) {
        console.error("Error copying image", error);
        Alert.alert("Error", "Failed to save image.");
      }
    }
  };

  // 🔹 Get initials
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ec407a", "#641b9a"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Section */}
        <View style={styles.profileContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveImage}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>

          {profileImage ? (
            <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
              <Image source={profileImage} style={styles.profileImage} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>
                {getInitials(userData?.name)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editIconContainer}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.editIcon}>✏</Text>
          </TouchableOpacity>
        </View>

        {/* User Details Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Employee ID:</Text>
            <Text style={styles.cardValue}>{userData?.emp_id ?? "N/A"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Name:</Text>
            <Text style={styles.cardValue}>{userData?.name ?? "N/A"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Email:</Text>
            <Text style={styles.cardValue}>{userData?.email ?? "N/A"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Role:</Text>
            <Text style={styles.cardValue}>{userData?.role ?? "N/A"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Department:</Text>
            <Text style={styles.cardValue}>{userData?.department ?? "N/A"}</Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for Edit Options */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.modalButton} onPress={handleChangeImage}>
              <Text style={styles.modalButtonText}>Change Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={handleDeleteImage}>
              <Text style={styles.modalButtonText}>Delete Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>✖</Text>
          </TouchableOpacity>
          {profileImage && (
            <Image source={profileImage} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
};

// 💅 Polished and Properly Aligned Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: "#ec407a",
  },
  placeholderImage: {
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
    elevation: 3,
  },
  editIcon: {
    color: "#000",
    fontSize: 16,
  },
  saveButton: {
    position: "absolute",
    alignItems: 'center',
    top: -60,
    right: 10,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  card: {
    width: "90%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  cardLabel: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardValue: {
    color: "#fff",
    fontSize: 16,
    flexShrink: 1,
    textAlign: "right",
  },
  backButton: {
    marginTop: 25,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
  },
  modalButton: {
    width: "100%",
    backgroundColor: "#ec407a",
    borderRadius: 10,
    paddingVertical: 12,
    marginVertical: 6,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "90%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
  },
  closeButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default ProfileView;