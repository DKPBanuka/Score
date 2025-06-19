import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// --- Reusable Components ---
const ScoreButton = ({ label, onPress, color = '#4CAF50', flex = 1, small = false, disabled = false }) => (
  <TouchableOpacity 
    style={[
      small ? styles.smallScoreButton : styles.scoreButton, 
      { backgroundColor: color, flex: flex },
      disabled && styles.disabledButton
    ]} 
    onPress={() => onPress(label)}
    disabled={disabled}
  >
    <Text style={small ? styles.smallScoreButtonText : styles.scoreButtonText}>{label}</Text>
  </TouchableOpacity>
);

const PlayerRow = ({ player, isStriker = false, isBowler = false, onPress }) => {
  const sr = (player.balls > 0) ? (player.score / player.balls * 100).toFixed(2) : "0.00";
  const er = (player.overs > 0) ? (player.runs / player.overs).toFixed(2) : "0.00";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[
        styles.tableRow, 
        isStriker && styles.strikerRow,
        isBowler && styles.bowlerRow
      ]}>
        <Text style={[styles.tableCellText, {flex: 4, textAlign: 'left', fontWeight: isStriker ? 'bold' : 'normal'}]}>
          {player.name}{isStriker ? '*' : ''}
        </Text>
        {isBowler ? (
          <>
            <Text style={styles.tableCellText}>{player.overs.toFixed(1)}</Text>
            <Text style={styles.tableCellText}>{player.maidens}</Text>
            <Text style={styles.tableCellText}>{player.runs}</Text>
            <Text style={styles.tableCellText}>{player.wickets}</Text>
            <Text style={[styles.tableCellText, {flex: 2}]}>{er}</Text>
          </>
        ) : (
          <>
            <Text style={styles.tableCellText}>{player.score}</Text>
            <Text style={styles.tableCellText}>{player.balls}</Text>
            <Text style={styles.tableCellText}>{player.fours}</Text>
            <Text style={styles.tableCellText}>{player.sixes}</Text>
            <Text style={[styles.tableCellText, {flex: 2}]}>{sr}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const BallIndicator = ({ ball, small = false }) => {
  const ballValue = typeof ball === 'object' ? 
    `${ball.type.charAt(0)}${ball.runs > 0 ? `+${ball.runs}` : ''}` : 
    ball;
  
  const isBoundary = ball === 4 || ball === 6;
  const isWicket = String(ball).includes('W');
  const isExtra = typeof ball === 'object';
  const isDotBall = ball === 0;

  return (
    <View style={[
      small ? styles.smallBall : styles.ball, 
      isBoundary && styles.ballBoundary, 
      isWicket && styles.ballWicket,
      isExtra && styles.ballExtra,
      isDotBall && styles.dotBall,
    ]}>
      <Text style={[
        small ? styles.smallBallText : styles.ballText, 
        (isBoundary || isWicket || isExtra) && {color: '#FFF'}
      ]}>
        {ballValue}
      </Text>
    </View>
  );
};

const ScoringScreen = ({ route, navigation }) => {
  const { 
    initialBattingTeam = 'Lions XI', 
    initialBowlingTeam = 'Tigers XI', 
    totalOvers = 10,
    teamAPlayers = [
      {id: 1, name: 'Banuka'}, 
      {id: 2, name: 'Pasindu'}, 
      {id: 3, name: 'Kasun'}, 
      {id: 4, name: 'Ruwan'}
    ],
    teamBPlayers = [
      {id: 1, name: 'Charitha'}, 
      {id: 2, name: 'Nimal'}, 
      {id: 3, name: 'Dasun'}, 
      {id: 4, name: 'Malinga'}
    ]
  } = route.params || {};

  // Match state with all cricket rules implemented
  const [matchState, setMatchState] = useState({
    inning: 1,
    target: 0,
    battingTeamName: initialBattingTeam,
    bowlingTeamName: initialBowlingTeam,
    score: 0, 
    wickets: 0, 
    overs: 0, 
    balls: 0, 
    currentOver: [],
    extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0, penalty: 0 },
    batsmen: [
      { id: 1, name: 'Banuka', score: 0, balls: 0, fours: 0, sixes: 0, onStrike: true, isOut: false },
      { id: 2, name: 'Pasindu', score: 0, balls: 0, fours: 0, sixes: 0, onStrike: false, isOut: false }
    ],
    partnership: { runs: 0, balls: 0, batsman1: 1, batsman2: 2 },
    bowler: { id: 1, name: 'Charitha', overs: 0, maidens: 0, runs: 0, wickets: 0 },
    nextBatsmanId: 3,
    nextBowlerId: 2,
    allOvers: [],
    teamAPlayers,
    teamBPlayers,
    isPowerplay: true,
    powerplayOvers: 0
  });

  const [history, setHistory] = useState([]);
  const [isPlayerModalVisible, setPlayerModalVisible] = useState(false);
  const [isWicketModalVisible, setWicketModalVisible] = useState(false);
  const [isExtraModalVisible, setExtraModalVisible] = useState(false);
  const [isPartnershipModalVisible, setPartnershipModalVisible] = useState(false);
  const [isExtrasModalVisible, setExtrasModalVisible] = useState(false);
  const [isInningsOver, setIsInningsOver] = useState(false);
  const [modalType, setModalType] = useState('batsman');
  const [currentExtraType, setCurrentExtraType] = useState(null);
  const [animation] = useState(new Animated.Value(0));

  // Animation for score updates
  const animateScore = () => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 500,
      easing: Easing.elastic(1),
      useNativeDriver: true
    }).start();
  };

  const animatedStyle = {
    transform: [{
      scale: animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1]
      })
    }]
  };

  // Check for innings completion
  useEffect(() => {
    if (isInningsOver) return;

    const isOverLimit = matchState.overs >= totalOvers;
    const allOut = matchState.wickets >= (matchState.teamAPlayers.length - 1); // 11 players - 1 = 10 wickets max
    const targetChased = matchState.inning === 2 && matchState.score >= matchState.target;

    if (allOut || isOverLimit || targetChased) {
      if (matchState.inning === 1) {
        setIsInningsOver(true);
      } else {
        // Match over
        let resultText = '';
        if (matchState.inning === 2) {
          if (matchState.score === matchState.target - 1) {
            resultText = "Match Tied!";
          } else if (matchState.score >= matchState.target) {
            const wicketsLeft = (matchState.teamAPlayers.length - 1) - matchState.wickets;
            resultText = `${matchState.battingTeamName} won by ${wicketsLeft} wickets`;
          } else {
            const runsDiff = matchState.target - matchState.score - 1;
            resultText = `${matchState.bowlingTeamName} won by ${runsDiff} runs`;
          }
        }
        navigation.replace('MatchSummary', { 
          matchState: matchState, 
          result: resultText,
          totalOvers: totalOvers
        });
      }
    }
  }, [matchState.score, matchState.wickets, matchState.overs]);

  // Save state to history for undo functionality
  const saveToHistory = () => setHistory(prev => [...prev, JSON.parse(JSON.stringify(matchState))]);

  // Handle runs scored
  const handleRuns = (runs) => {
    saveToHistory();
    animateScore();
    
    setMatchState(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      const striker = newState.batsmen.find(b => b.onStrike && !b.isOut);

      if (striker) {
        // Update score and striker stats
        newState.score += runs;
        striker.score += runs;
        newState.bowler.runs += runs;
        striker.balls++;
        newState.balls++;
        newState.partnership.runs += runs;
        newState.partnership.balls++;

        // Update boundary counts
        if (runs === 4) striker.fours++;
        if (runs === 6) striker.sixes++;

        // Check for maiden over (only if no runs scored in the over so far)
        const isMaidenCandidate = newState.currentOver.every(
          ball => ball === 0 || (typeof ball === 'object' && (ball.type === 'Byes' || ball.type === 'LegByes'))
        );
        
        if (isMaidenCandidate && runs > 0) {
          newState.bowler.maidens = Math.max(0, newState.bowler.maidens - 1);
        }
      }

      // Add to current over
      newState.currentOver.push(runs);

      // Check for over completion
      if (newState.balls === 6) {
        completeOver(newState);
      } else if (runs % 2 !== 0) {
        // Rotate strike for odd runs
        newState.batsmen.forEach(b => { if(!b.isOut) b.onStrike = !b.onStrike });
      }

      return newState;
    });
  };

  // Complete the current over
  const completeOver = (state) => {
    state.allOvers.push({ 
      overNumber: state.overs + 1, 
      balls: state.currentOver,
      bowler: state.bowler.name
    });
    
    state.overs++;
    state.bowler.overs += 0.5; // Track as 0.5 to handle maidens properly
    
    // Check for maiden over (no runs including extras except byes/legbyes)
    const isMaiden = state.currentOver.every(
      ball => ball === 0 || (typeof ball === 'object' && (ball.type === 'Byes' || ball.type === 'LegByes'))
    );
    
    if (isMaiden) {
      state.bowler.maidens += 0.5;
    }
    
    state.balls = 0;
    state.currentOver = [];
    
    // Rotate strike at the end of the over
    state.batsmen.forEach(b => { if(!b.isOut) b.onStrike = !b.onStrike });
    
    // Check powerplay status (first 6 overs in limited overs cricket)
    if (state.overs === 6 && state.inning === 1) {
      state.isPowerplay = false;
    }
  };

  // Handle extras (wides, no balls, byes, leg byes)
  const handleExtra = (type, runs) => {
    setExtraModalVisible(false);
    saveToHistory();
    animateScore();
    
    setMatchState(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      const extraKey = type.toLowerCase();
      
      // Update extras count
      newState.extras[extraKey] += runs;
      newState.score += runs;
      
      // Add to bowler's runs except for byes/legbyes
      if(type !== 'Byes' && type !== 'LegByes') {
        newState.bowler.runs += runs;
      }

      // Create extra object for the over
      const extraObj = { type, runs };
      newState.currentOver.push(extraObj);

      // Handle different extra types
      switch(type) {
        case 'Wides':
        case 'NoBalls':
          // These don't count as balls faced
          break;
          
        case 'Byes':
        case 'LegByes':
          // Count as balls faced but not against bowler
          newState.balls++;
          newState.partnership.balls++;
          break;
          
        case 'Penalty':
          // Doesn't count as ball faced
          break;
      }

      // Check for over completion
      if (newState.balls === 6) {
        completeOver(newState);
      }

      return newState;
    });
  };

  // Handle wicket fall
  const handleWicket = (dismissalType) => {
    setWicketModalVisible(false);
    saveToHistory();
    
    setMatchState(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      const strikerIndex = newState.batsmen.findIndex(b => b.onStrike && !b.isOut);

      if(strikerIndex !== -1 && newState.wickets < (newState.teamAPlayers.length - 1)) {
        // Update wicket count
        newState.wickets++;
        newState.balls++;
        newState.bowler.wickets++;
        
        // Add to current over
        newState.currentOver.push(`W-${dismissalType}`);
        
        // Mark batsman as out
        newState.batsmen[strikerIndex].isOut = true;
        
        // Reset partnership
        newState.partnership = { runs: 0, balls: 0, batsman1: null, batsman2: null };
        
        // Check for over completion
        if (newState.balls === 6) {
          completeOver(newState);
        }

        // If not all out, prompt for new batsman
        if (newState.wickets < (newState.teamAPlayers.length - 1)) {
          setModalType('batsman');
          setTimeout(() => setPlayerModalVisible(true), 100);
        }
      }

      return newState;
    });
  };

  // Handle new player selection (batsman or bowler)
  const handleNewPlayerSelection = (player) => {
    setPlayerModalVisible(false);
    saveToHistory();
    
    setMatchState(prevState => {
      const newState = JSON.parse(JSON.stringify(prevState));
      
      if(modalType === 'batsman' || modalType === 'retire') {
        // Find the outgoing batsman
        const outBatsmanIndex = newState.batsmen.findIndex(b => 
          (b.onStrike && b.isOut) || (modalType === 'retire' && b.onStrike)
        );
        
        if (outBatsmanIndex !== -1) {
          if(modalType === 'retire') {
            newState.batsmen[outBatsmanIndex].isOut = true;
          }
          
          // Add new batsman
          const newBatsman = { 
            ...player, 
            score: 0, 
            balls: 0, 
            fours: 0, 
            sixes: 0, 
            onStrike: true, 
            isOut: false, 
            id: newState.nextBatsmanId 
          };
          
          newState.batsmen.push(newBatsman);
          newState.nextBatsmanId++;
          
          // Find the non-striker
          const nonStriker = newState.batsmen.find(b => !b.onStrike && !b.isOut);
          
          // Set up new partnership
          newState.partnership = { 
            runs: 0, 
            balls: 0, 
            batsman1: newState.nextBatsmanId-1, 
            batsman2: nonStriker?.id || null 
          };
        }
      } else if (modalType === 'bowler') {
        // Change bowler
        newState.bowler = { 
          ...player, 
          overs: 0, 
          maidens: 0, 
          runs: 0, 
          wickets: 0,
          id: newState.nextBowlerId
        };
        newState.nextBowlerId++;
      }
      
      return newState;
    });
  };

  // Undo last action
  const handleUndo = () => {
    if(history.length > 0) {
      setMatchState(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
    } else {
      Alert.alert("Cannot Undo", "No more actions to undo.");
    }
  };

  // Start next innings
  const handleStartNextInnings = () => {
    setIsInningsOver(false);
    saveToHistory();
    
    setMatchState(prev => {
      const newBatsmen = prev.teamBPlayers.slice(0, 2).map((p, i) => ({
        ...p,
        score: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        onStrike: i === 0,
        isOut: false,
        id: i + 1
      }));
      
      return {
        ...prev,
        inning: 2,
        target: prev.score + 1,
        score: 0, 
        wickets: 0, 
        overs: 0, 
        balls: 0, 
        currentOver: [],
        extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0, penalty: 0 },
        batsmen: newBatsmen,
        bowler: { 
          ...prev.teamAPlayers[0], 
          overs: 0, 
          maidens: 0, 
          runs: 0, 
          wickets: 0,
          id: 1
        },
        nextBatsmanId: 3, 
        nextBowlerId: 2,
        allOvers: [],
        battingTeamName: prev.bowlingTeamName,
        bowlingTeamName: prev.battingTeamName,
        isPowerplay: true,
        powerplayOvers: 0,
        partnership: { 
          runs: 0, 
          balls: 0, 
          batsman1: 1, 
          batsman2: 2 
        },
      };
    });
  };

  // Get current striker and non-striker
  const striker = matchState.batsmen.find(b => b.onStrike && !b.isOut);
  const nonStriker = matchState.batsmen.find(b => !b.onStrike && !b.isOut);
  
  // Calculate match statistics
  const totalBalls = (matchState.overs * 6) + matchState.balls;
  const crr = totalBalls > 0 ? (matchState.score / (totalBalls / 6)).toFixed(2) : '0.00';
  const rrr = matchState.inning === 2 ? 
    ((matchState.target - matchState.score) / Math.max(0.1, (totalOvers * 6 - totalBalls) / 6)).toFixed(2) : 
    null;
  
  const extrasTotal = Object.values(matchState.extras).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={['#1E3C72', '#2A5298']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {matchState.battingTeamName} vs {matchState.bowlingTeamName}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('FullScorecard', { matchState, totalOvers })}>
          <Ionicons name="stats-chart" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* Main Scorecard */}
        <Animated.View style={[styles.mainScorecard, animatedStyle]}>
          <View style={styles.scorecardHeader}>
            <Text style={styles.inningTitle}>
              {matchState.battingTeamName}, {matchState.inning === 1 ? '1st' : '2nd'} Innings
              {matchState.isPowerplay && <Text style={styles.powerplayBadge}> POWERPLAY</Text>}
            </Text>
            {matchState.inning === 2 && (
              <Text style={styles.targetText}>Target: {matchState.target}</Text>
            )}
          </View>
          
          <View style={styles.scoreRow}>
            <Text style={styles.mainScore}>
              {matchState.score}<Text style={styles.wicketsText}>/{matchState.wickets}</Text>
              <Text style={styles.oversText}> ({matchState.overs}.{matchState.balls})</Text>
            </Text>
            <View style={styles.rateContainer}>
              <Text style={styles.crrText}>CRR: {crr}</Text>
              {matchState.inning === 2 && (
                <Text style={styles.rrrText}>RRR: {rrr > 0 ? rrr : '---'}</Text>
              )}
            </View>
          </View>
          
          <Text style={styles.extrasText}>Extras: {extrasTotal} (w {matchState.extras.wides}, nb {matchState.extras.noballs}, b {matchState.extras.byes}, lb {matchState.extras.legbyes})</Text>
        </Animated.View>

        {/* Batsmen and Bowler Stats */}
        <View style={styles.statsContainer}>
          {/* Batsmen Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, {flex: 4}]}>Batsman</Text>
            <Text style={styles.tableHeaderText}>R</Text>
            <Text style={styles.tableHeaderText}>B</Text>
            <Text style={styles.tableHeaderText}>4s</Text>
            <Text style={styles.tableHeaderText}>6s</Text>
            <Text style={[styles.tableHeaderText, {flex: 2}]}>SR</Text>
          </View>
          
          {/* Striker */}
          {striker && <PlayerRow player={striker} isStriker={true} />}
          
          {/* Non-Striker */}
          {nonStriker && <PlayerRow player={nonStriker} />}
          
          {/* Bowler Header */}
          <View style={[styles.tableHeader, {marginTop: 15}]}>
            <Text style={[styles.tableHeaderText, {flex: 4}]}>Bowler</Text>
            <Text style={styles.tableHeaderText}>O</Text>
            <Text style={styles.tableHeaderText}>M</Text>
            <Text style={styles.tableHeaderText}>R</Text>
            <Text style={styles.tableHeaderText}>W</Text>
            <Text style={[styles.tableHeaderText, {flex: 2}]}>ER</Text>
          </View>
          
          {/* Current Bowler */}
          <TouchableOpacity 
            onPress={() => {
              setModalType('bowler'); 
              setPlayerModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <PlayerRow player={matchState.bowler} isBowler={true}/>
          </TouchableOpacity>
        </View>

        {/* Current Over */}
        <View style={styles.overSection}>
          <Text style={styles.sectionTitle}>This Over</Text>
          <View style={styles.ballContainer}>
            {matchState.currentOver.length > 0 ? (
              matchState.currentOver.map((ball, index) => (
                <BallIndicator key={index} ball={ball} />
              ))
            ) : (
              <Text style={styles.noBallsText}>No balls bowled yet</Text>
            )}
          </View>
        </View>

        {/* Previous Overs */}
        <View style={styles.overSection}>
          <Text style={styles.sectionTitle}>Previous Overs</Text>
          <ScrollView 
            horizontal={true} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.prevOversScroll}
          >
            {matchState.allOvers.length > 0 ? (
              matchState.allOvers.slice().reverse().map(over => (
                <View key={over.overNumber} style={styles.prevOverContainer}>
                  <Text style={styles.prevOverNumber}>Over {over.overNumber} - {over.bowler}</Text>
                  <View style={styles.ballContainer}>
                    {over.balls.map((ball, index) => (
                      <BallIndicator key={index} ball={ball} small={true}/>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noBallsText}>No overs completed yet</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Scoring Buttons Footer */}
      <LinearGradient 
        colors={['#f5f7fa', '#c3cfe2']} 
        style={styles.footer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Extras and Actions Row */}
        <View style={styles.buttonRow}>
          <ScoreButton 
            label="WD" 
            onPress={() => {
              setCurrentExtraType('Wides');
              setExtraModalVisible(true);
            }} 
            color="#6c757d" 
            small={true}
          />
          <ScoreButton 
            label="NB" 
            onPress={() => {
              setCurrentExtraType('NoBalls');
              setExtraModalVisible(true);
            }} 
            color="#6c757d" 
            small={true}
          />
          <ScoreButton 
            label="Bye" 
            onPress={() => {
              setCurrentExtraType('Byes');
              setExtraModalVisible(true);
            }} 
            color="#6c757d" 
            small={true}
          />
          <ScoreButton 
            label="LB" 
            onPress={() => {
              setCurrentExtraType('LegByes');
              setExtraModalVisible(true);
            }} 
            color="#6c757d" 
            small={true}
          />
        </View>
        
        {/* Actions Row */}
        <View style={styles.buttonRow}>
          <ScoreButton 
            label="Undo" 
            onPress={handleUndo} 
            color="#ffc107" 
            small={true}
            disabled={history.length === 0}
          />
          <ScoreButton 
            label="Partnership" 
            onPress={() => setPartnershipModalVisible(true)} 
            color="#17a2b8" 
            small={true}
          />
          <ScoreButton 
            label="Extras" 
            onPress={() => setExtrasModalVisible(true)} 
            color="#17a2b8" 
            small={true}
          />
          <ScoreButton 
            label="Retire" 
            onPress={() => {
              setModalType('retire'); 
              setPlayerModalVisible(true);
            }} 
            color="#E0A800" 
            small={true}
            disabled={!striker || matchState.wickets >= (matchState.teamAPlayers.length - 1)}
          />
        </View>
        
        {/* Runs Row 1 */}
        <View style={styles.buttonRow}>
          {[0,1,2,3].map(r => (
            <ScoreButton 
              key={r} 
              label={r} 
              onPress={handleRuns} 
              color={r === 0 ? '#5a6268' : '#4CAF50'}
            />
          ))}
        </View>
        
        {/* Runs Row 2 */}
        <View style={styles.buttonRow}>
          <ScoreButton label={4} onPress={handleRuns} color="#2196F3" />
          <ScoreButton label={5} onPress={handleRuns} color="#4CAF50" />
          <ScoreButton label={6} onPress={handleRuns} color="#FF5722" />
          <ScoreButton 
            label="W" 
            onPress={() => setWicketModalVisible(true)} 
            color="#dc3545" 
            disabled={!striker || matchState.wickets >= (matchState.teamAPlayers.length - 1)}
          />
        </View>
      </LinearGradient>

      {/* Wicket Modal */}
      <Modal transparent={true} visible={isWicketModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Dismissal Type</Text>
            <View style={styles.modalButtonRow}>
              <ScoreButton label="Bowled" onPress={() => handleWicket('Bowled')} color="#dc3545" small={true}/>
              <ScoreButton label="Catch" onPress={() => handleWicket('Catch')} color="#dc3545" small={true}/>
              <ScoreButton label="LBW" onPress={() => handleWicket('LBW')} color="#dc3545" small={true}/>
              <ScoreButton label="Run Out" onPress={() => handleWicket('Run Out')} color="#dc3545" small={true}/>
            </View>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setWicketModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Extra Runs Modal */}
      <Modal transparent={true} visible={isExtraModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Runs with {currentExtraType}?</Text>
            <View style={styles.modalButtonRow}>
              {[0,1,2,3,4,5,6].map(r => (
                <ScoreButton 
                  key={r} 
                  label={r} 
                  onPress={() => handleExtra(currentExtraType, r)} 
                  color={r === 0 ? '#5a6268' : '#4CAF50'}
                  small={true}
                />
              ))}
            </View>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setExtraModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Player Selection Modal */}
      <Modal transparent={true} visible={isPlayerModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select New {modalType === 'retire' ? 'Batsman' : (modalType === 'bowler' ? 'Bowler' : 'Batsman')}
            </Text>
            <ScrollView style={styles.playerScroll}>
              {(modalType === 'bowler' ? matchState.teamBPlayers : matchState.teamAPlayers)
                .filter(p => !matchState.batsmen.some(b => b.id === p.id && !b.isOut))
                .map(player => (
                  <TouchableOpacity 
                    key={player.id} 
                    style={styles.playerSelectItem} 
                    onPress={() => handleNewPlayerSelection(player)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.playerSelectText}>{player.name}</Text>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setPlayerModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Partnership Modal */}
      <Modal transparent={true} visible={isPartnershipModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Current Partnership</Text>
            <Text style={styles.partnershipText}>
              {matchState.partnership.runs} Runs ({matchState.partnership.balls} Balls)
            </Text>
            <Text style={styles.partnershipRate}>
              Run Rate: {matchState.partnership.balls > 0 ? 
                ((matchState.partnership.runs / matchState.partnership.balls) * 6).toFixed(2) : '0.00'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setPartnershipModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Extras Modal */}
      <Modal transparent={true} visible={isExtrasModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Extras Breakdown</Text>
            <View style={styles.extrasContainer}>
              <Text style={styles.extrasText}>Wides: {matchState.extras.wides}</Text>
              <Text style={styles.extrasText}>No Balls: {matchState.extras.noballs}</Text>
              <Text style={styles.extrasText}>Byes: {matchState.extras.byes}</Text>
              <Text style={styles.extrasText}>Leg Byes: {matchState.extras.legbyes}</Text>
              <Text style={styles.extrasText}>Penalty: {matchState.extras.penalty}</Text>
              <Text style={styles.extrasTotal}>Total Extras: {extrasTotal}</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setExtrasModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Innings Over Modal */}
      <Modal transparent={true} visible={isInningsOver} animationType="slide">
        <View style={styles.modalContainer}>
          <LinearGradient 
            colors={['#1F2937', '#111827']} 
            style={styles.summaryModalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.summaryModalTitle}>Innings Complete</Text>
            <Text style={styles.summaryScoreText}>
              {matchState.battingTeamName}: {matchState.score}/{matchState.wickets} ({matchState.overs}.{matchState.balls})
            </Text>
            <Text style={styles.summaryOversText}>Overs: {totalOvers}</Text>
            
            {matchState.inning === 1 && (
              <>
                <Text style={styles.summaryTargetText}>
                  {matchState.bowlingTeamName} need {matchState.score + 1} runs to win
                </Text>
                <TouchableOpacity 
                  style={styles.summaryButton} 
                  onPress={handleStartNextInnings}
                  activeOpacity={0.7}
                >
                  <Text style={styles.summaryButtonText}>START 2ND INNINGS</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.summaryCloseButton} 
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.7}
            >
              <Text style={styles.summaryCloseButtonText}>End Match</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10
  },
  mainScorecard: {
    padding: 20,
    backgroundColor: '#FFF',
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  scorecardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  inningTitle: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '600'
  },
  powerplayBadge: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: 'bold',
    marginLeft: 5
  },
  targetText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '600'
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  mainScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  wicketsText: {
    fontSize: 24,
    color: '#718096'
  },
  oversText: {
    fontSize: 18,
    color: '#718096',
    fontWeight: '500'
  },
  rateContainer: {
    alignItems: 'flex-end'
  },
  crrText: {
    fontSize: 16,
    color: '#38A169',
    fontWeight: '600'
  },
  rrrText: {
    fontSize: 16,
    color: '#DD6B20',
    fontWeight: '600',
    marginTop: 4
  },
  extrasText: {
    fontSize: 14,
    color: '#4A5568'
  },
  statsContainer: {
    backgroundColor: '#FFF',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7'
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#718096',
    textAlign: 'center',
    fontSize: 12
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7'
  },
  strikerRow: {
    backgroundColor: '#EBF8FF'
  },
  bowlerRow: {
    backgroundColor: '#FFF5F5'
  },
  tableCellText: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    color: '#4A5568'
  },
  overSection: {
    paddingHorizontal: 15,
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2D3748'
  },
  prevOversScroll: {
    paddingRight: 15
  },
  prevOverContainer: {
    marginRight: 15,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: width * 0.6
  },
  prevOverNumber: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    color: '#4A5568',
    fontSize: 12
  },
  ballContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  noBallsText: {
    textAlign: 'center',
    color: '#A0AEC0',
    fontStyle: 'italic'
  },
  ball: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  smallBall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 4
  },
  ballBoundary: {
    backgroundColor: '#4299E1'
  },
  ballWicket: {
    backgroundColor: '#F56565'
  },
  ballExtra: {
    backgroundColor: '#718096'
  },
  dotBall: {
    backgroundColor: '#E2E8F0'
  },
  ballText: {
    color: '#2D3748',
    fontWeight: 'bold',
    fontSize: 14
  },
  smallBallText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  scoreButton: {
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  smallScoreButton: {
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  disabledButton: {
    opacity: 0.5
  },
  scoreButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  smallScoreButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2D3748'
  },
  modalButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  playerScroll: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.4
  },
  playerSelectItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7'
  },
  playerSelectText: {
    fontSize: 16,
    color: '#4A5568'
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 16,
    color: '#4299E1',
    fontWeight: '600'
  },
  partnershipText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: '#2D3748'
  },
  partnershipRate: {
    fontSize: 18,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 10
  },
  extrasContainer: {
    marginVertical: 10
  },
  extrasTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    paddingTop: 10
  },
  summaryModalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10
  },
  summaryModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center'
  },
  summaryScoreText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center'
  },
  summaryOversText: {
    fontSize: 16,
    color: '#CBD5E0',
    marginBottom: 15
  },
  summaryTargetText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center'
  },
  summaryButton: {
    backgroundColor: '#4299E1',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },
  summaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  summaryCloseButton: {
    padding: 10
  },
  summaryCloseButtonText: {
    fontSize: 16,
    color: '#CBD5E0'
  }
});

export default ScoringScreen;