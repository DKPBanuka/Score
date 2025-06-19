import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';

const CreateTeamScreen = ({ route, navigation }) => {
    const isEdit = route.params?.isEdit || false;
    const teamData = route.params?.teamData || null;

    const [teamName, setTeamName] = useState('');
    const [players, setPlayers] = useState(Array(11).fill(''));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && teamData) {
            setTeamName(teamData.name);
            // Ensure players array has a fixed length for the inputs
            const existingPlayers = teamData.players || [];
            const newPlayers = Array(11).fill('').map((_, index) => existingPlayers[index] || '');
            setPlayers(newPlayers);
        }
    }, [isEdit, teamData]);

    const handlePlayerNameChange = (index, name) => {
        const newPlayers = [...players];
        newPlayers[index] = name;
        setPlayers(newPlayers);
    };

    const handleSave = async () => {
        if(!teamName.trim()) {
            Alert.alert("Team Name Required", "Please enter a name for your team.");
            return;
        }
        setLoading(true);
        // Filter out empty player names before saving
        const finalPlayers = players.filter(p => p.trim() !== '');

        const dataToSave = {
            name: teamName.trim(),
            players: finalPlayers.length > 0 ? finalPlayers : players.map((p,i)=> p || `Player ${i+1}`), // Save default names if all are empty
            updatedAt: serverTimestamp(),
        };

        try {
            if (isEdit) {
                const teamRef = doc(db, "teams", teamData.id);
                await setDoc(teamRef, dataToSave, { merge: true });
            } else {
                await addDoc(collection(db, "teams"), { ...dataToSave, createdAt: serverTimestamp() });
            }
            navigation.goBack();
        } catch(error) {
            console.error("Error saving team: ", error);
            Alert.alert("Error", "Could not save the team.");
        }
        setLoading(false);
    };
    
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={createStyles.container}
        >
            <SafeAreaView style={createStyles.container}>
                <FlatList
                    ListHeaderComponent={
                        <View style={{padding: 20}}>
                            <Text style={createStyles.label}>Team Name</Text>
                            <TextInput
                                style={createStyles.teamInput}
                                placeholder="e.g., The Avengers"
                                placeholderTextColor="#9CA3AF"
                                value={teamName}
                                onChangeText={setTeamName}
                            />
                            <Text style={[createStyles.label, {marginTop: 20}]}>Players ({players.filter(p=>p).length}/{players.length})</Text>
                        </View>
                    }
                    data={players}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({item, index}) => (
                        <View style={createStyles.playerInputRow}>
                            <Text style={createStyles.playerIndex}>{index + 1}</Text>
                            <TextInput
                                style={createStyles.input}
                                placeholder={`Player ${index + 1} Name`}
                                placeholderTextColor="#9CA3AF"
                                value={item}
                                onChangeText={(text) => handlePlayerNameChange(index, text)}
                            />
                        </View>
                    )}
                    contentContainerStyle={{paddingBottom: 100}}
                />
                <View style={createStyles.footer}>
                    <TouchableOpacity style={[createStyles.button, loading && {backgroundColor: '#4B5563'}]} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={createStyles.buttonText}>{isEdit ? 'UPDATE TEAM' : 'SAVE TEAM'}</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

const createStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    label: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
    teamInput: { backgroundColor: '#1F2937', color: '#FFF', padding: 15, borderRadius: 10, fontSize: 18, fontWeight: 'bold' },
    playerInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 20 },
    playerIndex: { fontSize: 16, color: '#9CA3AF', marginRight: 10, width: 30 },
    input: { flex: 1, backgroundColor: '#1F2937', color: '#FFF', padding: 15, borderRadius: 10, fontSize: 16 },
    footer: { padding: 20, backgroundColor: '#1F2937', borderTopColor: 'rgba(255,255,255,0.1)', borderTopWidth: 1},
    button: { backgroundColor: '#16A34A', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default CreateTeamScreen;