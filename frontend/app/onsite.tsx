import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const OnSitePage = () => {
  const router = useRouter();

  const handleLogoutOffice = () => {
    console.log('Logout Office clicked');
  };

  const handleLoginOnsite = () => {
    console.log('Login Onsite clicked');
  };

  const handleLogoutOnsite = () => {
    console.log('Logout Onsite clicked');
  };

  const handleLoginOffice = () => {
    console.log('Login Office clicked');
  };

  return (
    <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
      <Text style={styles.title}>On Site Page</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleLogoutOffice}>
        <Text style={styles.buttonText}>Logout Office</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLoginOnsite}>
        <Text style={styles.buttonText}>Login Onsite</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogoutOnsite}>
        <Text style={styles.buttonText}>Logout Onsite</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLoginOffice}>
        <Text style={styles.buttonText}>Login Office</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnSitePage;
