import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// --- Helper Components for Bracket ---
const Matchup = ({ match, round, isFinal }) => (
    <View style={styles.matchupContainer}>
        <View style={styles.matchup}>
            <Text style={[styles.team, match.winner === match.teamA && styles.winner]}>{match.teamA || 'TBD'}</Text>
            <View style={styles.vsSeparator} />
            <Text style={[styles.team, match.winner === match.teamB && styles.winner]}>{match.teamB || 'TBD'}</Text>
        </View>
        {!isFinal && <View style={[styles.connector, { height: round === 1 ? 70 : 160 }]} />}
    </View>
);

const KnockoutBracket = ({ fixtures }) => {
    const rounds = fixtures.reduce((acc, fixture) => {
        acc[fixture.round] = acc[fixture.round] || [];
        acc[fixture.round].push(fixture);
        return acc;
    }, {});

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScrollView}>
            <View style={styles.bracketContainer}>
                {Object.keys(rounds).map(roundNumber => (
                    <View key={roundNumber} style={styles.round}>
                        <Text style={styles.roundTitle}>Round {roundNumber}</Text>
                        {rounds[roundNumber].map(match => (
                            <Matchup 
                                key={match.id} 
                                match={match} 
                                round={parseInt(roundNumber)}
                                isFinal={!rounds[parseInt(roundNumber) + 1]}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

// --- Fixture Card Component ---
const FixtureCard = ({ fixture, onSelectWinner, onScoreMatch }) => {
    const hasWinner = !!fixture.winner;
    const resultText = fixture.result || `${fixture.winner} won the match.`;

    return (
        <View style={styles.fixtureCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.matchNumber}>Match {fixture.matchNumber}</Text>
                {hasWinner && <View style={styles.resultBadge}><Text style={styles.resultBadgeText}>RESULT</Text></View>}
            </View>

            <View style={styles.teamsContainer}>
                <View style={styles.teamRow}>
                    <Text style={[styles.teamName, hasWinner && fixture.winner !== fixture.teamA && styles.loser]}>{fixture.teamA}</Text>
                    <Text style={styles.teamScore}>{fixture.scoreA || ''}</Text>
                </View>
                <View style={styles.teamRow}>
                    <Text style={[styles.teamName, hasWinner && fixture.winner !== fixture.teamB && styles.loser]}>{fixture.teamB}</Text>
                    <Text style={styles.teamScore}>{fixture.scoreB || ''}</Text>
                </View>
            </View>

            {hasWinner ? (
                <Text style={styles.resultSummary}>{resultText}</Text>
            ) : (
                <View style={styles.fixtureActions}>
                    <TouchableOpacity 
                        style={styles.winnerButton} 
                        onPress={() => onSelectWinner(fixture)}
                    >
                        <Ionicons name="trophy-outline" size={18} color="#FFC107" />
                        <Text style={styles.actionButtonText}>Set Winner</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.scoreButton} 
                        onPress={() => onScoreMatch(fixture)}
                    >
                        <Ionicons name="create-outline" size={18} color="#FFF" />
                        <Text style={styles.actionButtonText}>Score</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const FixturesScreen = ({ route }) => {
    const navigation = useNavigation();
    const { tournamentId, tournamentData } = route.params;
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isBracketVisible, setBracketVisible] = useState(false);

    const fetchFixtures = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "tournaments", tournamentId, "fixtures"), orderBy("round"), orderBy("matchNumber"));
            const querySnapshot = await getDocs(q);
            const fetchedFixtures = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFixtures(fetchedFixtures);
        } catch (error) {
            console.error("Error fetching fixtures: ", error);
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useFocusEffect(
        useCallback(() => {
            fetchFixtures();
        }, [fetchFixtures])
    );

    const handleSelectWinner = async (winner) => {
        if (!selectedMatch) return;
        
        const matchRef = doc(db, "tournaments", tournamentId, "fixtures", selectedMatch.id);
        const nextRound = selectedMatch.round + 1;
        const nextMatchNumber = Math.ceil(selectedMatch.matchNumber / 2);
        const nextMatchId = `match_${nextRound}_${nextMatchNumber}`;
        const nextMatchRef = doc(db, "tournaments", tournamentId, "fixtures", nextMatchId);
        
        try {
            await updateDoc(matchRef, { 
                winner: winner, 
                played: true, 
                result: `${winner} won.` 
            });
            
            if (tournamentData.type === 'Knockout') {
                const isTeamA = selectedMatch.matchNumber % 2 !== 0;
                const docSnap = await getDoc(nextMatchRef);
                
                if (docSnap.exists()) {
                    if (isTeamA) {
                        await updateDoc(nextMatchRef, { teamA: winner });
                    } else {
                        await updateDoc(nextMatchRef, { teamB: winner });
                    }
                } else {
                    const newMatchData = {
                        teamA: isTeamA ? winner : 'TBD',
                        teamB: isTeamA ? 'TBD' : winner,
                        round: nextRound,
                        matchNumber: nextMatchNumber,
                        played: false,
                        winner: null
                    };
                    await setDoc(nextMatchRef, newMatchData);
                }
            }
            
            fetchFixtures();
        } catch (error) { 
            console.error("Error updating winner: ", error); 
        }
        setSelectedMatch(null);
    };

    if (loading) {
        return (
            <View style={[styles.container, {justifyContent: 'center'}]}>
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {tournamentData?.type === 'Knockout' && fixtures.length > 0 && (
                <TouchableOpacity 
                    style={styles.bracketButton} 
                    onPress={() => setBracketVisible(true)}
                >
                    <Ionicons name="git-network-outline" size={20} color="#FFF" />
                    <Text style={styles.bracketButtonText}>View Bracket</Text>
                </TouchableOpacity>
            )}
            
            <FlatList
                data={fixtures}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <FixtureCard 
                        fixture={item} 
                        onSelectWinner={setSelectedMatch}
                        onScoreMatch={() => navigation.navigate('Scoring', { 
                            fixtureId: item.id,
                            tournamentId,
                            initialBattingTeam: item.teamA, 
                            initialBowlingTeam: item.teamB,
                            totalOvers: tournamentData?.oversPerMatch || 10,
                        })}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Fixtures not generated yet.</Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            {/* Winner Selection Modal */}
            <Modal 
                transparent={true} 
                visible={!!selectedMatch} 
                onRequestClose={() => setSelectedMatch(null)}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Winner</Text>
                        <TouchableOpacity 
                            style={styles.modalButton} 
                            onPress={() => handleSelectWinner(selectedMatch.teamA)}
                        >
                            <Text style={styles.modalButtonText}>{selectedMatch?.teamA}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.modalButton} 
                            onPress={() => handleSelectWinner(selectedMatch.teamB)}
                        >
                            <Text style={styles.modalButtonText}>{selectedMatch?.teamB}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={() => setSelectedMatch(null)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* Bracket View Modal */}
            <Modal 
                visible={isBracketVisible} 
                onRequestClose={() => setBracketVisible(false)} 
                animationType="slide"
            >
                <SafeAreaView style={styles.container}>
                    <TouchableOpacity 
                        style={styles.closeBracketButton} 
                        onPress={() => setBracketVisible(false)}
                    >
                        <Ionicons name="close-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                    <KnockoutBracket fixtures={fixtures} />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#111827' 
    },
    listContent: {
        padding: 20,
        flexGrow: 1
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: { 
        color: '#9CA3AF', 
        fontSize: 16 
    },
    // Bracket Styles
    bracketButton: { 
        flexDirection: 'row', 
        backgroundColor: '#007BFF', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 15, 
        marginHorizontal: 20, 
        borderRadius: 8, 
        marginVertical: 10 
    },
    bracketButtonText: { 
        color: '#FFF', 
        fontWeight: 'bold', 
        fontSize: 16, 
        marginLeft: 10 
    },
    bracketScrollView: { 
        paddingVertical: 20 
    },
    bracketContainer: { 
        flexDirection: 'row', 
        paddingHorizontal: 20, 
        alignItems: 'center' 
    },
    round: { 
        marginHorizontal: 20, 
        justifyContent: 'space-around', 
        height: '100%', 
        paddingVertical: 20 
    },
    roundTitle: { 
        color: '#FFF', 
        fontSize: 18, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 20 
    },
    matchupContainer: { 
        alignItems: 'center', 
        position: 'relative' 
    },
    matchup: { 
        backgroundColor: '#1F2937', 
        padding: 15, 
        borderRadius: 8, 
        width: 150 
    },
    team: { 
        color: '#E5E7EB', 
        fontSize: 16, 
        paddingVertical: 8 
    },
    vsSeparator: { 
        borderBottomWidth: 1, 
        borderBottomColor: '#374151' 
    },
    winner: { 
        fontWeight: 'bold', 
        color: '#FFC107' 
    },
    connector: { 
        position: 'absolute', 
        right: -20, 
        top: '50%', 
        width: 20, 
        borderTopWidth: 2, 
        borderRightWidth: 2, 
        borderColor: 'rgba(255,255,255,0.2)'
    },
    closeBracketButton: { 
        position: 'absolute', 
        top: 10, 
        right: 20, 
        zIndex: 10 
    },
    // Fixture Card Styles
    fixtureCard: { 
        backgroundColor: '#1F2937', 
        borderRadius: 12, 
        marginBottom: 10, 
        overflow: 'hidden' 
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 15, 
        paddingBottom: 10 
    },
    matchNumber: { 
        color: '#9CA3AF', 
        fontSize: 14 
    },
    resultBadge: { 
        backgroundColor: '#16A34A', 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 5 
    },
    resultBadgeText: { 
        color: '#FFF', 
        fontWeight: 'bold', 
        fontSize: 12 
    },
    teamsContainer: { 
        padding: 20 
    },
    teamRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 8
    },
    teamName: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#E5E7EB'
    },
    teamScore: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#E5E7EB'
    },
    loser: { 
        color: '#6B7280' 
    },
    resultSummary: { 
        color: '#FFC107', 
        padding: 20, 
        paddingTop: 10, 
        fontStyle: 'italic', 
        textAlign: 'center' 
    },
    fixtureActions: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        borderTopWidth: 1, 
        borderTopColor: '#374151', 
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    scoreButton: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 15,
        backgroundColor: '#007BFF'
    },
    winnerButton: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 15, 
        borderRightWidth: 1, 
        borderRightColor: '#374151',
        backgroundColor: '#1F2937'
    },
    actionButtonText: { 
        color: '#FFF', 
        fontWeight: 'bold', 
        marginLeft: 8
    },
    // Modal Styles
    modalOverlay: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.7)' 
    },
    modalContent: { 
        width: '80%', 
        backgroundColor: '#1F2937', 
        padding: 20, 
        borderRadius: 12 
    },
    modalTitle: { 
        color: '#FFF', 
        fontSize: 20, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 20 
    },
    modalButton: { 
        backgroundColor: '#007BFF', 
        padding: 15, 
        borderRadius: 8, 
        marginBottom: 10 
    },
    modalButtonText: { 
        color: '#FFF', 
        textAlign: 'center', 
        fontWeight: 'bold' 
    },
    cancelButton: { 
        marginTop: 10 
    },
    cancelButtonText: { 
        color: '#9CA3AF', 
        textAlign: 'center' 
    },
});

export default FixturesScreen;