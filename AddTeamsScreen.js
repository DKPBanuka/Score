import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, writeBatch, doc, updateDoc } from 'firebase/firestore';

const AddTeamsScreen = ({ route, navigation }) => {
    const { tournamentId, tournamentData, existingTeams } = route.params;
    const [teams, setTeams] = useState(() => Array(tournamentData.teamsCount).fill('').map((_, i) => ({ id: i, name: existingTeams.find(t => t.teamNumber === i + 1)?.name || '' })));
    const [loading, setLoading] = useState(false);

    const handleTeamNameChange = (index, name) => {
        const newTeams = [...teams];
        newTeams[index].name = name;
        setTeams(newTeams);
    };

    const generateFixtures = (teamsList) => {
        const fixtures = [];
        if (tournamentData.type === 'Knockout') {
            for (let i = 0; i < teamsList.length; i += 2) {
                if(teamsList[i+1]) {
                    fixtures.push({ teamA: teamsList[i].name, teamB: teamsList[i+1].name, round: 1, matchNumber: fixtures.length + 1, played: false, winner: null });
                }
            }
        } else { // League or Round Robin
            for (let i = 0; i < teamsList.length; i++) {
                for (let j = i + 1; j < teamsList.length; j++) {
                    fixtures.push({ teamA: teamsList[i].name, teamB: teamsList[j].name, round: 1, matchNumber: fixtures.length + 1, played: false, winner: null });
                }
            }
        }
        return fixtures;
    };

    const handleSaveTeams = async () => {
        const filledTeams = teams.filter(t => t.name.trim() !== '');
        if (filledTeams.length !== tournamentData.teamsCount) {
            Alert.alert("Incomplete", `Please enter names for all ${tournamentData.teamsCount} teams.`);
            return;
        }
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const teamsRef = collection(db, "tournaments", tournamentId, "teams");
            teams.forEach((team, index) => {
                const docRef = doc(teamsRef, `team_${index + 1}`);
                batch.set(docRef, { name: team.name, teamNumber: index + 1 });
            });
            
            const fixtures = generateFixtures(teams);
            const fixturesRef = collection(db, "tournaments", tournamentId, "fixtures");
            fixtures.forEach((fixture, index) => {
                const fixtureDocRef = doc(fixturesRef, `match_${index + 1}`);
                batch.set(fixtureDocRef, fixture);
            });

            const tournamentRef = doc(db, "tournaments", tournamentId);
            batch.update(tournamentRef, { fixturesGenerated: true });

            await batch.commit();
            setLoading(false);
            navigation.goBack();
        } catch (error) {
            console.error("Error saving teams and fixtures: ", error);
            Alert.alert("Error", "Could not save teams and generate fixtures.");
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={teams}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.inputRow}>
                        <Text style={styles.indexText}>{index + 1}</Text>
                        <TextInput style={styles.input} placeholder={`Team ${index + 1} Name`} placeholderTextColor="#9CA3AF" value={item.name} onChangeText={(text) => handleTeamNameChange(index, text)} />
                    </View>
                )}
                contentContainerStyle={{padding: 20, paddingBottom: 100}}
            />
            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, loading && {backgroundColor: '#4B5563'}]} onPress={handleSaveTeams} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>SAVE TEAMS & GENERATE FIXTURES</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    indexText: { width: 30, fontSize: 16, color: '#9CA3AF' },
    input: { flex: 1, backgroundColor: '#1F2937', color: '#FFF', padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#374151'},
    footer: { padding: 20, backgroundColor: '#1F2937', borderTopColor: 'rgba(255,255,255,0.1)', borderTopWidth: 1},
    button: { backgroundColor: '#16A34A', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default AddTeamsScreen;