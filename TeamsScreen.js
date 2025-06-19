import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // Import useNavigation
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const TeamCard = ({ team, onPress, onDelete }) => (
    <TouchableOpacity style={styles.teamCard} onPress={onPress}>
        <Ionicons name="shirt-outline" size={28} color="#007BFF" style={styles.cardIcon}/>
        <View style={{flex: 1}}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamDetails}>{team.players?.length || 0} Players</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
             <Ionicons name="trash-bin-outline" size={22} color="#F44336" />
        </TouchableOpacity>
    </TouchableOpacity>
);

const TeamsScreen = () => {
    const navigation = useNavigation(); // Use hook to get navigation object
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    // This is the corrected way to use useFocusEffect
    useFocusEffect(
      useCallback(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "teams"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                setTeams(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) { 
                console.error("Error fetching teams: ", error); 
            }
            setLoading(false);
        };

        fetchTeams();
      }, [])
    );

    const handleDelete = (teamId, teamName) => {
        Alert.alert(
            "Delete Team",
            `Are you sure you want to delete "${teamName}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                    await deleteDoc(doc(db, "teams", teamId));
                    // Refresh the list after deletion
                    setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
                }}
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
             {/* The manual header is now removed. The header comes from the Tab Navigator options. */}
            
            {loading ? <ActivityIndicator size="large" color="#FFF" style={{flex: 1}} /> : (
                <FlatList
                    data={teams}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => 
                        <TeamCard 
                            team={item} 
                            onPress={() => navigation.navigate('CreateTeam', { isEdit: true, teamData: item })} 
                            onDelete={() => handleDelete(item.id, item.name)}
                        />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color="#4B5563" />
                            <Text style={styles.emptyText}>No Teams Found</Text>
                            <Text style={styles.emptySubText}>Create your first team!</Text>
                        </View>
                    )}
                    contentContainerStyle={{padding: 20}}
                />
            )}

            {/* Floating Action Button to add a new team */}
            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => navigation.navigate('CreateTeam')}
            >
                <Ionicons name="add-outline" size={32} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    // Removed old header style
    teamCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', padding: 20, borderRadius: 12, marginBottom: 10 },
    cardIcon: { marginRight: 15 },
    teamName: { fontSize: 18, fontWeight: 'bold', color: '#E5E7EB' },
    teamDetails: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
    emptyText: { fontSize: 20, fontWeight: '600', color: '#9CA3AF', marginTop: 15 },
    emptySubText: { fontSize: 16, color: '#4B5563', marginTop: 5 },
    deleteButton: { padding: 5 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#007BFF',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    }
});

export default TeamsScreen;
