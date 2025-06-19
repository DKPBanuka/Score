import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const OptionSelector = ({ title, options, selectedOption, onSelect }) => (
    <View style={createStyles.settingRow}>
        <Text style={createStyles.label}>{title}</Text>
        <View style={createStyles.optionContainer}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option}
                    style={[createStyles.optionButton, selectedOption === option && createStyles.optionButtonSelected]}
                    onPress={() => onSelect(option)}
                >
                    <Text style={[createStyles.optionText, selectedOption === option && createStyles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const CreateTournamentScreen = ({ route, navigation }) => {
    const isEdit = route.params?.isEdit || false;
    const tournamentData = route.params?.tournamentData || null;

    const [name, setName] = useState('');
    const [type, setType] = useState('League');
    const [teamsCount, setTeamsCount] = useState('');
    const [playersPerTeam, setPlayersPerTeam] = useState('11');
    const [extraPlayers, setExtraPlayers] = useState('4');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && tournamentData) {
            setName(tournamentData.name);
            setType(tournamentData.type || 'League');
            setTeamsCount(String(tournamentData.teamsCount));
            setPlayersPerTeam(String(tournamentData.playersPerTeam || '11'));
            setExtraPlayers(String(tournamentData.extraPlayers || '4'));
        }
    }, [isEdit, tournamentData]);

    const handleAction = async () => {
        if (!name.trim() || !teamsCount.trim() || !playersPerTeam.trim()) {
            Alert.alert("All Fields Required", "Please fill in all the required details.");
            return;
        }
        setLoading(true);

        const data = {
            name: name.trim(),
            type: type,
            teamsCount: parseInt(teamsCount),
            playersPerTeam: parseInt(playersPerTeam),
            extraPlayers: parseInt(extraPlayers) || 0,
            createdAt: tournamentData?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        try {
            if (isEdit) {
                const tournamentRef = doc(db, "tournaments", tournamentData.id);
                await setDoc(tournamentRef, data, { merge: true });
            } else {
                await addDoc(collection(db, "tournaments"), data);
            }
            setLoading(false);
            navigation.goBack();
        } catch (error) {
            console.error("Error saving tournament: ", error);
            Alert.alert("Error", "Could not save the tournament.");
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={createStyles.container}
        >
            <LinearGradient colors={['#1F2937', '#111827']} style={{flex: 1}}>
                <SafeAreaView style={{flex: 1}}>
                    <ScrollView contentContainerStyle={createStyles.form}>
                        <View style={createStyles.inputGroup}>
                            <Text style={createStyles.label}>Tournament Name</Text>
                            <TextInput style={createStyles.input} value={name} onChangeText={setName} placeholder="e.g., Summer Cup 2025" placeholderTextColor="#9CA3AF"/>
                        </View>
                        
                        <OptionSelector 
                            title="Tournament Type" 
                            options={['League', 'Knockout']} 
                            selectedOption={type} 
                            onSelect={setType} 
                        />
                        
                        <View style={createStyles.row}>
                            <View style={[createStyles.inputGroup, {flex: 1, marginRight: 10}]}>
                                <Text style={createStyles.label}>No. of Teams</Text>
                                <TextInput style={createStyles.input} value={teamsCount} onChangeText={setTeamsCount} keyboardType="number-pad" placeholder="8" placeholderTextColor="#9CA3AF"/>
                            </View>
                            <View style={[createStyles.inputGroup, {flex: 1}]}>
                                <Text style={createStyles.label}>Players per Side</Text>
                                <TextInput style={createStyles.input} value={playersPerTeam} onChangeText={setPlayersPerTeam} keyboardType="number-pad" placeholder="11" placeholderTextColor="#9CA3AF"/>
                            </View>
                        </View>

                        <View style={createStyles.inputGroup}>
                            <Text style={createStyles.label}>Extra Players (Optional)</Text>
                            <TextInput style={createStyles.input} value={extraPlayers} onChangeText={setExtraPlayers} keyboardType="number-pad" placeholder="4" placeholderTextColor="#9CA3AF"/>
                        </View>
                    </ScrollView>
                    <View style={createStyles.footer}>
                        <TouchableOpacity style={[createStyles.button, loading && {backgroundColor: '#4B5563'}]} onPress={handleAction} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={createStyles.buttonText}>{isEdit ? 'UPDATE TOURNAMENT' : 'CREATE TOURNAMENT'}</Text>}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const createStyles = StyleSheet.create({
    container: { flex: 1 },
    form: { padding: 20, paddingBottom: 100 },
    inputGroup: { width: '100%', marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginBottom: 8},
    input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFF', padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#374151'},
    row: { flexDirection: 'row', justifyContent: 'space-between'},
    settingRow: { marginTop: 20 },
    optionContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    optionButton: { flex: 1, padding: 15, marginHorizontal: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: '#374151', borderRadius: 8, alignItems: 'center' },
    optionButtonSelected: { backgroundColor: '#007BFF', borderColor: '#007BFF' },
    optionText: { fontSize: 16, color: '#FFF' },
    optionTextSelected: { fontWeight: 'bold' },
    footer: { padding: 20, backgroundColor: '#1F2937', borderTopColor: 'rgba(255,255,255,0.1)', borderTopWidth: 1},
    button: { backgroundColor: '#16A34A', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default CreateTournamentScreen;