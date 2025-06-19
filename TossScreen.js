import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const TossScreen = ({ route, navigation }) => {
  // Parameters with defaults
  const { 
    teamAName = 'Team A', 
    teamBName = 'Team B', 
    totalOvers = '20' 
  } = route.params || {};

  // State management
  const [tossWinner, setTossWinner] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Animation values
  const spin = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const winnerOpacity = useSharedValue(0);
  const choiceButtonsTranslateY = useSharedValue(50);
  const coinOpacity = useSharedValue(1);

  // Check if Reanimated is ready
  useEffect(() => {
    setIsReady(true);
    return () => {
      // Cleanup animations
      spin.value = 0;
      buttonScale.value = 1;
    };
  }, []);

  // Coin flip animation
  const coinAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = spin.value * 1800; // 5 full rotations
    const scale = interpolate(spin.value, [0, 0.5, 1], [1, 1.2, 1]);
    
    return { 
      transform: [
        { rotateY: `${rotateY}deg` },
        { scale: scale }
      ],
      opacity: coinOpacity.value
    };
  });

  // Button press animation
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  // Winner reveal animation
  const winnerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: winnerOpacity.value,
    transform: [{ scale: winnerOpacity.value }]
  }));

  // Choice buttons animation
  const choiceButtonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: winnerOpacity.value,
    transform: [{ translateY: choiceButtonsTranslateY.value }]
  }));

  const handleToss = () => {
    if (isFlipping || !isReady) return;
    
    // Reset states
    setIsFlipping(true);
    setTossWinner(null);
    winnerOpacity.value = 0;
    choiceButtonsTranslateY.value = 50;
    spin.value = 0;
    coinOpacity.value = 1;
    
    // Button press effect
    buttonScale.value = withSpring(0.95);
    buttonScale.value = withSpring(1, { damping: 3 });
    
    // Coin flip animation
    spin.value = withTiming(1, { 
      duration: 2000, 
      easing: Easing.out(Easing.cubic) 
    });
    
    // Determine winner after animation
    setTimeout(() => {
      const winner = Math.random() < 0.5 ? teamAName : teamBName;
      setTossWinner(winner);
      setIsFlipping(false);
      
      // Hide coin
      coinOpacity.value = withTiming(0, { duration: 300 });
      
      // Animate winner reveal
      winnerOpacity.value = withTiming(1, { duration: 500 });
      
      // Animate choice buttons
      choiceButtonsTranslateY.value = withSpring(0, { damping: 10 });
    }, 2000);
  };

  const handleChoice = (choice) => {
    const battingTeam = choice === 'Bat' ? tossWinner : 
                      (tossWinner === teamAName ? teamBName : teamAName);
    const bowlingTeam = battingTeam === teamAName ? teamBName : teamAName;
    
    navigation.navigate('Scoring', {
      teamAName,
      teamBName,
      totalOvers,
      tossWinner,
      tossChoice: choice,
      battingTeam,
      bowlingTeam,
    });
  }

  if (!isReady) {
    return (
      <LinearGradient colors={['#1a2f6f', '#0c164f']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a2f6f', '#0c164f']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>TOSS TIME</Text>
            <Text style={styles.subtitle}>Decide who bats first</Text>
          </View>
          
          {/* Teams Display */}
          <View style={styles.teamsContainer}>
            <View style={styles.teamCard}>
              <View style={[styles.teamLogo, { backgroundColor: '#ff4757' }]} />
              <Text style={styles.teamName}>{teamAName}</Text>
            </View>
            
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            
            <View style={styles.teamCard}>
              <View style={[styles.teamLogo, { backgroundColor: '#2ed573' }]} />
              <Text style={styles.teamName}>{teamBName}</Text>
            </View>
          </View>
          
          {/* Main Content Area */}
          <View style={styles.mainContent}>
            {/* Animated Coin - Will disappear after toss */}
            <View style={styles.coinContainer}>
              <Animated.View style={[styles.coin, coinAnimatedStyle]}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.coinGradient}
                >
                  <MaterialCommunityIcons 
                    name="coin" 
                    size={60} 
                    color="#D4AF37" 
                  />
                </LinearGradient>
              </Animated.View>
            </View>
            
            {/* Toss Button or Winner Options */}
            {!tossWinner ? (
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity 
                  style={[styles.button, isFlipping && styles.disabledButton]} 
                  onPress={handleToss} 
                  disabled={isFlipping}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isFlipping ? ['#A0AEC0', '#718096'] : ['#4e54c8', '#8f94fb']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons 
                      name={isFlipping ? "sync" : "repeat"} 
                      size={24} 
                      color="#FFF" 
                      style={{ marginRight: 10 }} 
                    />
                    <Text style={styles.buttonText}>
                      {isFlipping ? 'FLIPPING...' : 'TOSS COIN'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={[styles.resultContainer, winnerAnimatedStyle]}>
                <View style={styles.winnerCard}>
                  <Text style={styles.winnerText}>
                    <Text style={{ fontWeight: 'bold', color: '#FFD700' }}>{tossWinner}</Text> won the toss!
                  </Text>
                </View>
                
                <Text style={styles.choiceText}>Choose to:</Text>
                
                <Animated.View style={[styles.choiceButtons, choiceButtonsAnimatedStyle]}>
                  <TouchableOpacity 
                    style={styles.choiceButton} 
                    onPress={() => handleChoice('Bat')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#2E7D32']}
                      style={styles.choiceButtonGradient}
                    >
                      <MaterialCommunityIcons 
                        name="cricket" 
                        size={36} 
                        color="#FFF" 
                        style={styles.batIcon}
                      />
                      <Text style={styles.choiceButtonText}>BAT FIRST</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.choiceButton} 
                    onPress={() => handleChoice('Bowl')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#2196F3', '#0D47A1']}
                      style={styles.choiceButtonGradient}
                    >
                      <MaterialCommunityIcons 
                        name="tennis-ball" 
                        size={36} 
                        color="#FFF" 
                        style={styles.ballIcon}
                      />
                      <Text style={styles.choiceButtonText}>BOWL FIRST</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
  },
  teamCard: {
    alignItems: 'center',
    flex: 1,
    maxWidth: width * 0.35,
  },
  teamLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 15,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  coinContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  coin: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  coinGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    width: width * 0.7,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  winnerCard: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  winnerText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#FFF',
    letterSpacing: 1,
  },
  choiceText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 25,
    letterSpacing: 1,
  },
  choiceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  choiceButton: {
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  choiceButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batIcon: {
    transform: [{ rotate: '-30deg' }],
    marginBottom: 10,
  },
  ballIcon: {
    marginBottom: 10,
  },
  choiceButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default TossScreen;