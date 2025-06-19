import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const TournamentCard = ({ tournament, onPress }) => (
    <TouchableOpacity style={styles.tournamentCard} onPress={onPress}>
        <View style={styles.cardIcon}>
            <Ionicons name="trophy" size={28} color="#FFC107" />
        </View>
        <View style={{flex: 1}}>
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <Text style={styles.tournamentDetails}>{tournament.type} | {tournament.teamsCount} Teams</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={24} color="#9CA3AF" />
    </TouchableOpacity>
);

const TournamentsScreen = ({ navigation }) => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTournaments = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "tournaments"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const tournamentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTournaments(tournamentList);
        } catch (error) {
            console.error("Error fetching tournaments: ", error);
        }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { fetchTournaments(); }, []));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tournaments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreateTournament')}>
                    <Ionicons name="add-circle" size={32} color="#007BFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} size="large" color="#FFF" />
            ) : (
                <FlatList
                    data={tournaments}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TournamentCard 
                            tournament={item} 
                            onPress={() => navigation.navigate('TournamentDashboard', { tournamentId: item.id, tournamentName: item.name, tournamentData: item })} 
                        />
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="sad-outline" size={60} color="#4B5563" />
                            <Text style={styles.emptyText}>No Tournaments Found</Text>
                            <Text style={styles.emptySubText}>Create your first tournament now!</Text>
                        </View>
                    )}
                    contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 20}}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 30 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    tournamentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', padding: 20, borderRadius: 12, marginBottom: 10 },
    cardIcon: { marginRight: 15 },
    tournamentName: { fontSize: 18, fontWeight: 'bold', color: '#E5E7EB' },
    tournamentDetails: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
    emptyText: { fontSize: 20, fontWeight: '600', color: '#9CA3AF', marginTop: 15 },
    emptySubText: { fontSize: 16, color: '#4B5563', marginTop: 5 },
});

export default TournamentsScreen;