import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useRouter } from "expo-router";

const { height } = Dimensions.get('window');

let animationHasPlayed = false;

export default function App() {
   const router = useRouter();
  const [animationComplete, setAnimationComplete] = useState(animationHasPlayed);
  const vAnim = useRef(new Animated.Value(-height / 2)).current;
  const sAnim = useRef(new Animated.Value(height / 2)).current;
  const sOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animationComplete) {
      return;
    }
    const vAnimation = Animated.timing(vAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    });

    const sAnimation = Animated.timing(sAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    });

    const nameAnimation = Animated.timing(nameOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    vAnimation.start(() => {
      sOpacity.setValue(1);
      sAnimation.start(() => {
        nameAnimation.start(() => {
          setTimeout(() => {
            animationHasPlayed = true;
            setAnimationComplete(true);
          }, 1000);
        });
      });
    });
  }, []);

  const handlePress = (role: string) => {
    console.log(`${role} selected`);
    if (role === "Candidate") {
      router.push("/login"); // ⬅ Navigate to signup page
    }
    else if (role === "Admin") {
    router.push("/AdminLogin"); // Navigate to adminint.tsx
  }
  else if (role === "TL") {
    router.push("/TeamleaderLogin"); // If you have a TL page
  }
  };

  const vStyle = { transform: [{ translateY: vAnim }] };
  const sStyle = { transform: [{ translateY: sAnim }], opacity: sOpacity };
  const nameStyle = { opacity: nameOpacity };

  if (!animationComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoWrapper, vStyle]}>
            <Image source={require('../assets/images/vLogo.png')} style={styles.logo} />
          </Animated.View>
          <Animated.View style={[styles.logoWrapper, sStyle]}>
            <Image source={require('../assets/images/sLogo.png')} style={styles.logo} />
          </Animated.View>
        </View>
        <Animated.View style={[styles.nameWrapper, nameStyle]}>
          <Image source={require('../assets/images/vienName.png')} style={styles.name} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.finalContainer}>
      <View style={styles.header}>
        <Image source={require('../assets/images/vsLogo.png')} style={styles.headerLogo} />
      </View>
      <ImageBackground
        source={require('../assets/images/pinkcolor.png')}
        style={styles.contentContainer}
      >
        <Text style={styles.welcomeText}>Welcome to Vienstereoptic</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select your Role</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={() => handlePress('Admin')}>
              <Text style={styles.buttonText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handlePress('TL')}>
              <Text style={styles.buttonText}>TL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => handlePress('Candidate')}>
              <Text style={styles.buttonText}>Employee/Intern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginHorizontal: -15,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  nameWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  name: {
    width: 200,
    height: 50,
    resizeMode: 'contain',
  },
  finalContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dcdfe5',
  },
  headerLogo: {
    width: 150,
    height: 75,
    resizeMode: 'contain',
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 80,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  card: {
    width: '80%',
    minHeight: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.83)',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fa0734ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 20,
  },
  buttonsContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#e78d9eff',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 25,
    width: '100%',
    height: 65,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
