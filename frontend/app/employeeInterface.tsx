import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const EmployeeInterface = () => {
  const router = useRouter();

  return (
    <LinearGradient colors={['#ec407a', '#641b9a']} style={styles.container}>
      <Text style={styles.title}>Employee Portal</Text>
      
      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/profile10.png')} style={styles.icon} />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/profile')}>
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/punch10.png')} style={styles.icon} />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/punch')}>
          <Text style={styles.buttonText}>Punch</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/requests6.png')} style={styles.icon} />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/requests')}>
          <Text style={styles.buttonText}>Requests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/leave5.png')} style={styles.icon} />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/leave')}>
          <Text style={styles.buttonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.iconWrapper}>
          <Image source={require('../assets/images/requests6.png')} style={styles.icon} />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/timesheet')}>
          <Text style={styles.buttonText}>Timesheet</Text>
        </TouchableOpacity>
      </View>

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
  icon: {
    width: 34,
    height: 44,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    paddingRight: 20,
    paddingLeft: 40, // Space for the icon
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
});

export default EmployeeInterface;
