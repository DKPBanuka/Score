import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';

const MatchCard = ({ match, onPress, onDelete }) => (
    <TouchableOpacity style={styles.matchCard} onPress={onPress}>
        <View style={{flex: 1}}>
            <Text style={styles.matchTeams} numberOfLines={1}>{match.battingTeamName} vs {match.bowlingTeamName}</Text>
            {match.isMatchOver ? (
                <Text style={styles.matchResult}>{match.result || "Match Completed"}</Text>
            ) : (
                <Text style={styles.matchScore}>{match.score}/{match.wickets} ({match.overs}.{match.balls})</Text>
            )}
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
             <Ionicons name="trash-bin-outline" size={22} color="#F44336" />
        </TouchableOpacity>
    </TouchableOpacity>
);

const MatchesScreen = ({ navigation }) => {
    const [ongoingMatches, setOngoingMatches] = useState([]);
    const [completedMatches, setCompletedMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Ongoing'); // 'Ongoing' or 'Completed'

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const ongoingQuery = query(collection(db, "matches"), where("isMatchOver", "==", false), orderBy("createdAt", "desc"));
            const ongoingSnapshot = await getDocs(ongoingQuery);
            setOngoingMatches(ongoingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const completedQuery = query(collection(db, "matches"), where("isMatchOver", "==", true), orderBy("createdAt", "desc"));
            const completedSnapshot = await getDocs(completedQuery);
            setCompletedMatches(completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching matches: ", error);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useFocusEffect(useCallback(() => { fetchMatches(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchMatches(); };
    
    const handleDelete = async (matchId) => {
        Alert.alert(
            "Delete Match",
            "Are you sure you want to delete this match record permanently?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                    await deleteDoc(doc(db, "matches", matchId));
                    fetchMatches(); // Refresh the list
                }}
            ]
        );
    };

    const renderList = (data, type) => (
        loading ? <ActivityIndicator color="#FFF" style={{marginTop: 50}}/> : (
            data.length > 0 ? (
                <FlatList
                    data={data}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <MatchCard 
                            match={item} 
                            onPress={() => navigation.navigate(type === 'Ongoing' ? 'Scoring' : 'FullScorecard', { matchId: item.id, matchState: item })} 
                            onDelete={() => handleDelete(item.id)}
                        />
                    )}
                    contentContainerStyle={{paddingBottom: 20}}
                />
            ) : <Text style={styles.noMatchesText}>No {type.toLowerCase()} matches found.</Text>
        )
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Matches</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'Ongoing' && styles.tabActive]} onPress={() => setActiveTab('Ongoing')}>
                    <Text style={styles.tabText}>Ongoing</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, activeTab === 'Completed' && styles.tabActive]} onPress={() => setActiveTab('Completed')}>
                    <Text style={styles.tabText}>Completed</Text>
                </TouchableOpacity>
            </View>

            <View style={{flex: 1}}>
                {activeTab === 'Ongoing' ? renderList(ongoingMatches, 'Ongoing') : renderList(completedMatches, 'Completed')}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { padding: 20, paddingTop: 30, alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, backgroundColor: '#1F2937', borderRadius: 10, padding: 4 },
    tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    tabActive: { backgroundColor: '#007BFF' },
    tabText: { color: '#FFF', fontWeight: '600' },
    matchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 20, marginHorizontal: 20, marginBottom: 10 },
    matchTeams: { fontSize: 16, fontWeight: '600', color: '#E5E7EB', flexShrink: 1 },
    matchScore: { fontSize: 14, color: '#9CA3AF', marginTop: 5 },
    matchResult: { fontSize: 14, color: '#16A34A', marginTop: 5, fontStyle: 'italic'},
    noMatchesText: { color: '#9CA3AF', textAlign: 'center', marginTop: 50 },
    deleteButton: { padding: 5, marginLeft: 10 },
});

export default MatchesScreen;
