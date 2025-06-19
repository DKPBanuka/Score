import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from '../context/LanguageContext'; 
import { db } from '../config/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const HomeScreen = () => {
    const navigation = useNavigation(); // Use navigation hook
    const { t } = useTranslation();
    const [ongoingMatches, setOngoingMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "matches"), where("isMatchOver", "==", false), orderBy("createdAt", "desc"), limit(5));
            const querySnapshot = await getDocs(q);
            setOngoingMatches(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching matches: ", error);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { fetchMatches(); }, []));

    return (
        // Changed to View because SafeAreaView is handled by the navigator now
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <TouchableOpacity style={styles.startMatchCard} onPress={() => navigation.navigate('MatchSetup')}>
                    <Ionicons name="add-circle" size={50} color="#FFF" />
                    <View>
                        <Text style={styles.startMatchTitle}>{t('newMatch')}</Text>
                        <Text style={styles.startMatchSubtitle}>{t('startNewMatch')}</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>{t('ongoingMatches')}</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#FFF" style={{marginTop: 20}}/>
                ) : ongoingMatches.length > 0 ? (
                    ongoingMatches.map(match => (
                        <TouchableOpacity key={match.id} style={styles.matchCard} onPress={() => navigation.navigate('Scoring', { matchId: match.id })}>
                            <View>
                                <Text style={styles.matchTeams}>{match.battingTeamName} vs {match.bowlingTeamName}</Text>
                                <Text style={styles.matchScore}>{match.score}/{match.wickets} ({match.overs}.{match.balls})</Text>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.noMatchesText}>{t('noOngoingMatches')}</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    // Removed the old header style
    scrollViewContent: { padding: 20 },
    startMatchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', borderRadius: 20, padding: 25, marginBottom: 30},
    startMatchTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginLeft: 15 },
    startMatchSubtitle: { fontSize: 14, color: '#E0E0E0', marginLeft: 15, marginTop: 4 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 15, },
    matchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 20, marginBottom: 10 },
    matchTeams: { fontSize: 16, fontWeight: '600', color: '#E5E7EB' },
    matchScore: { fontSize: 14, color: '#9CA3AF', marginTop: 5 },
    noMatchesText: { color: '#9CA3AF', textAlign: 'center', marginTop: 20 }
});

export default HomeScreen;