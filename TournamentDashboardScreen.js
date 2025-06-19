import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../config/firebase';
import { doc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const DashboardOption = ({ icon, label, description, onPress }) => (
    <TouchableOpacity style={dashboardStyles.optionCard} onPress={onPress}>
        <Ionicons name={icon} size={32} color="#007BFF" />
        <View style={dashboardStyles.optionTextContainer}>
            <Text style={dashboardStyles.optionLabel}>{label}</Text>
            <Text style={dashboardStyles.optionDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={24} color="#4B5563" />
    </TouchableOpacity>
);

const TournamentDashboardScreen = ({ route, navigation }) => {
    const { tournamentId } = route.params;
    const [tournamentData, setTournamentData] = useState(route.params.tournamentData || null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTournamentData = useCallback(async () => {
        try {
            const docRef = doc(db, "tournaments", tournamentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setTournamentData(data);
                navigation.setOptions({ title: data.name });

                const teamsRef = collection(db, "tournaments", tournamentId, "teams");
                const teamsSnapshot = await getDocs(teamsRef);
                const teamsList = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeams(teamsList);
            } else {
                console.log("No such document!");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error fetching tournament data: ", error);
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useFocusEffect(useCallback(() => {
        fetchTournamentData();
    }, [fetchTournamentData]));

    const handleDelete = () => {
        if (!tournamentData) return;
        Alert.alert(
            "Delete Tournament",
            `Are you sure you want to delete "${tournamentData.name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                    await deleteDoc(doc(db, "tournaments", tournamentId));
                    navigation.goBack();
                }}
            ]
        );
    };

    if (loading || !tournamentData) {
        return (
            <View style={[dashboardStyles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={dashboardStyles.container}>
            <View style={dashboardStyles.header}>
                <View style={dashboardStyles.logoPlaceholder}>
                    <Text style={dashboardStyles.logoPlaceholderText}>{tournamentData.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={dashboardStyles.tournamentName}>{tournamentData.name}</Text>

                <View style={dashboardStyles.detailsRow}>
                    <View style={dashboardStyles.detailItem}>
                        <Ionicons name="trophy-outline" size={18} color="#9CA3AF" />
                        <Text style={dashboardStyles.detailText}>{tournamentData.type}</Text>
                    </View>
                    <View style={dashboardStyles.detailItem}>
                        <Ionicons name="people-circle-outline" size={18} color="#9CA3AF" />
                        <Text style={dashboardStyles.detailText}>{tournamentData.teamsCount} Teams</Text>
                    </View>
                    <View style={dashboardStyles.detailItem}>
                        <Ionicons name="person-outline" size={18} color="#9CA3AF" />
                        <Text style={dashboardStyles.detailText}>{tournamentData.playersPerTeam} a Side</Text>
                    </View>
                </View>

                <View style={dashboardStyles.headerActions}>
                    <TouchableOpacity onPress={handleDelete} style={dashboardStyles.actionButton}>
                        <Ionicons name="trash-outline" size={24} color="#F44336" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateTournament', { isEdit: true, tournamentData })} style={dashboardStyles.actionButton}>
                        <Ionicons name="pencil-outline" size={24} color="#007BFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={dashboardStyles.optionsContainer}>
                <DashboardOption 
                    icon="people-outline" 
                    label="Teams" 
                    description={`${teams.length} / ${tournamentData.teamsCount} teams added`}
                    onPress={() => navigation.navigate('AddTeams', { tournamentId, tournamentData, existingTeams: teams })}
                />
                 <DashboardOption 
                    icon="list-outline" 
                    label="Fixtures" 
                    description="View the match schedule"
                    onPress={() => navigation.navigate('Fixtures', { tournamentId, tournamentName: tournamentData.name })}
                />
                 <DashboardOption 
                    icon="podium-outline" 
                    label="Points Table" 
                    description="Check the current standings"
                    onPress={() => {}}
                />
            </View>
        </SafeAreaView>
    );
};

const dashboardStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    logoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center', marginBottom: 15},
    logoPlaceholderText: { fontSize: 48, color: '#FFF', fontWeight: 'bold' },
    tournamentName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
    headerActions: { flexDirection: 'row', position: 'absolute', top: 15, right: 15 },
    actionButton: { padding: 10, marginLeft: 10 },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: 8 },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { color: '#9CA3AF', fontSize: 14, marginLeft: 5 },
    optionsContainer: { margin: 20 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', padding: 20, borderRadius: 12, marginBottom: 10 },
    optionTextContainer: { flex: 1, marginLeft: 15 },
    optionLabel: { fontSize: 18, fontWeight: 'bold', color: '#E5E7EB' },
    optionDescription: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});

export default TournamentDashboardScreen;