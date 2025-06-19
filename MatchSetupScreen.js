import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../context/LanguageContext';

const TeamSelectionCard = ({ team, onPress, side, onSelectSquad, playingSquad, t, playersPerSide }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <Text style={styles.cardLabel}>{side}</Text>
        {team ? (
            <View style={styles.teamSelectedContainer}>
                <Ionicons name="shirt" size={40} color="#007BFF" />
                <Text style={styles.teamName}>{team.name}</Text>
                <TouchableOpacity style={styles.selectSquadButton} onPress={onSelectSquad}>
                    <Text style={styles.selectSquadText}>
                        {playingSquad.length > 0 ? t('playersSelected', {count: playingSquad.length, total: playersPerSide}) : t('selectSquad')}
                    </Text>
                    <Ionicons name="people-outline" size={16} color="#007BFF" />
                </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.placeholderContainer}>
                <Ionicons name="add-circle-outline" size={40} color="#4B5563" />
                <Text style={styles.placeholderText}>{t('selectTeam')}</Text>
            </View>
        )}
    </TouchableOpacity>
);

const SettingStepper = ({ title, value, onIncrement, onDecrement }) => (
    <View style={styles.settingRow}>
        <Text style={styles.settingTitle}>{title}</Text>
        <View style={styles.stepperContainer}>
            <TouchableOpacity onPress={onDecrement} style={styles.stepperButton}><Ionicons name="remove" size={20} color="#FFF" /></TouchableOpacity>
            <Text style={styles.stepperValue}>{value}</Text>
            <TouchableOpacity onPress={onIncrement} style={styles.stepperButton}><Ionicons name="add" size={20} color="#FFF" /></TouchableOpacity>
        </View>
    </View>
);

const MatchSetupScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [teamA, setTeamA] = useState(null);
    const [teamB, setTeamB] = useState(null);
    const [playingXI_A, setPlayingXI_A] = useState([]);
    const [playingXI_B, setPlayingXI_B] = useState([]);
    const [playersPerSide, setPlayersPerSide] = useState(7);
    const [totalOvers, setTotalOvers] = useState(5);
    const [ballsPerOver, setBallsPerOver] = useState(6);
    const [modalVisible, setModalVisible] = useState(false);
    const [playerSelectModalVisible, setPlayerSelectModalVisible] = useState(false);
    const [selectingFor, setSelectingFor] = useState(null);
    const [allTeams, setAllTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tempSelectedPlayers, setTempSelectedPlayers] = useState([]);
    const [newPlayerName, setNewPlayerName] = useState('');

    useFocusEffect(
      useCallback(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "teams"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                setAllTeams(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) { console.error("Error fetching teams: ", error); }
            setLoading(false);
        };
        fetchTeams();
      }, [])
    );

    const openTeamSelection = (side) => { setSelectingFor(side); setModalVisible(true); };
    const handleTeamSelect = (team) => { if (selectingFor === 'A') { setTeamA(team); setPlayingXI_A([]); } else { setTeamB(team); setPlayingXI_B([]); } setModalVisible(false); };
    const openPlayerSelection = (side) => { const team = side === 'A' ? teamA : teamB; const squad = side === 'A' ? playingXI_A : playingXI_B; if (!team) { Alert.alert(t('selectTeamFirst')); return; } setSelectingFor(side); setTempSelectedPlayers(squad); setPlayerSelectModalVisible(true); };
    const handlePlayerToggle = (playerName) => { setTempSelectedPlayers(prev => { if (prev.includes(playerName)) { return prev.filter(p => p !== playerName); } else if (prev.length < playersPerSide) { return [...prev, playerName]; } else { Alert.alert(t('squadFull'), t('squadFullMsg', {count: playersPerSide})); return prev; } }); };
    const handleAddNewPlayer = async () => { const trimmedName = newPlayerName.trim(); if (!trimmedName) { Alert.alert(t('enterName'), t('nameEmpty')); return; } const teamToUpdate = selectingFor === 'A' ? teamA : teamB; if (!teamToUpdate) return; if (teamToUpdate.players.some(p => p.toLowerCase() === trimmedName.toLowerCase())) { Alert.alert(t('duplicatePlayer'), t('duplicatePlayerMsg', {name: trimmedName})); return; } const updatedPlayers = [...teamToUpdate.players, trimmedName]; const teamRef = doc(db, "teams", teamToUpdate.id); try { await updateDoc(teamRef, { players: updatedPlayers }); const updatedTeamData = { ...teamToUpdate, players: updatedPlayers }; if (selectingFor === 'A') setTeamA(updatedTeamData); else setTeamB(updatedTeamData); setAllTeams(allTeams.map(t => t.id === teamToUpdate.id ? updatedTeamData : t)); setNewPlayerName(''); } catch (error) { console.error("Error adding new player: ", error); Alert.alert("Error", "Could not add player."); }};
    const confirmPlayingSquad = () => { if (tempSelectedPlayers.length !== playersPerSide) { Alert.alert(t('squadCountError'), t('squadCountErrorMsg', {count: playersPerSide})); return; } if (selectingFor === 'A') setPlayingXI_A(tempSelectedPlayers); else setPlayingXI_B(tempSelectedPlayers); setPlayerSelectModalVisible(false); setTempSelectedPlayers([]); };
    const handleProceed = () => { if (!teamA || !teamB) { Alert.alert(t('selectBothTeams'), t('selectBothTeamsMsg')); return; } if (teamA.id === teamB.id) { Alert.alert(t('invalidSelection'), t('invalidSelectionMsg')); return; } if (playingXI_A.length !== playersPerSide || playingXI_B.length !== playersPerSide) { Alert.alert(t('selectSquads'), t('selectSquadsMsg', {count: playersPerSide})); return; } navigation.navigate('Toss', { teamAName: teamA.name, teamBName: teamB.name, teamAPlayers: playingXI_A, teamBPlayers: playingXI_B, totalOvers, playersPerTeam: playersPerSide, ballsPerOver, }); };

    const isButtonDisabled = !teamA || !teamB || playingXI_A.length !== playersPerSide || playingXI_B.length !== playersPerSide;
    const currentTeamForModal = selectingFor === 'A' ? teamA : teamB;

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1F2937', '#111827']} style={{flex: 1}}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Text style={styles.pageTitle}>{t('setupNewMatch')}</Text>
                    <View style={styles.teamSelectionWrapper}><TeamSelectionCard team={teamA} onPress={() => openTeamSelection('A')} side={t('teamA')} onSelectSquad={() => openPlayerSelection('A')} playingSquad={playingXI_A} t={t} playersPerSide={playersPerSide}/><Text style={styles.vsText}>VS</Text><TeamSelectionCard team={teamB} onPress={() => openTeamSelection('B')} side={t('teamB')} onSelectSquad={() => openPlayerSelection('B')} playingSquad={playingXI_B} t={t} playersPerSide={playersPerSide}/></View>
                    <View style={styles.settingsCard}><Text style={styles.settingsTitle}>{t('matchSettings')}</Text><SettingStepper title={t('oversPerMatch')} value={totalOvers} onIncrement={() => setTotalOvers(o => o + 1)} onDecrement={() => setTotalOvers(o => o > 1 ? o - 1 : 1)} /><SettingStepper title={t('playersPerSide')} value={playersPerSide} onIncrement={() => setPlayersPerSide(p => p < 15 ? p + 1 : 15)} onDecrement={() => setPlayersPerSide(p => p > 2 ? p - 1 : 2)} /><SettingStepper title={t('ballsPerOver')} value={ballsPerOver} onIncrement={() => setBallsPerOver(b => b < 8 ? b + 1 : 8)} onDecrement={() => setBallsPerOver(b => b > 3 ? b - 1 : 3)} /></View>
                </ScrollView>
                <View style={styles.footer}><TouchableOpacity style={[styles.button, isButtonDisabled && styles.buttonDisabled]} onPress={handleProceed} disabled={isButtonDisabled}><Text style={styles.buttonText}>{t('proceedToToss')}</Text></TouchableOpacity></View>
                
                <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}><SafeAreaView style={styles.modalContainer}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{t('selectTeamFor', {side: selectingFor})}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={30} color="#FFF" /></TouchableOpacity></View><TouchableOpacity style={styles.newTeamButton} onPress={() => navigation.navigate('CreateTeam')}><Ionicons name="add" size={24} color="#16A34A" /><Text style={styles.newTeamButtonText}>{t('createNewTeam')}</Text></TouchableOpacity>{loading ? <ActivityIndicator color="#FFF" /> : (<FlatList data={allTeams.filter(t => t.id !== (selectingFor === 'A' ? teamB?.id : teamA?.id))} keyExtractor={item => item.id} renderItem={({ item }) => (<TouchableOpacity style={styles.teamListItem} onPress={() => handleTeamSelect(item)}><Text style={styles.teamListItemText}>{item.name}</Text></TouchableOpacity>)} />)}</SafeAreaView></Modal>
                <Modal visible={playerSelectModalVisible} animationType="slide" onRequestClose={() => setPlayerSelectModalVisible(false)}><SafeAreaView style={styles.modalContainer}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{t('selectSquadFor', {selected: tempSelectedPlayers.length, total: playersPerSide})}</Text><TouchableOpacity onPress={() => setPlayerSelectModalVisible(false)}><Ionicons name="close" size={30} color="#FFF" /></TouchableOpacity></View><FlatList ListHeaderComponent={<View style={styles.addPlayerContainer}><TextInput style={styles.modalInput} placeholder={t('addNewPlayerPlaceholder')} placeholderTextColor="#9CA3AF" value={newPlayerName} onChangeText={setNewPlayerName} onSubmitEditing={handleAddNewPlayer} /><TouchableOpacity style={styles.addPlayerButtonModal} onPress={handleAddNewPlayer}><Ionicons name="add-circle" size={32} color="#16A34A" /></TouchableOpacity></View>} data={currentTeamForModal?.players || []} keyExtractor={(item, index) => `${item}-${index}`} renderItem={({item}) => { const isSelected = tempSelectedPlayers.includes(item); return ( <TouchableOpacity style={styles.playerSelectItem} onPress={() => handlePlayerToggle(item)}><Ionicons name={isSelected ? "checkbox" : "square-outline"} size={26} color={isSelected ? "#16A34A" : "#9CA3AF"} /><Text style={styles.playerSelectText}>{item}</Text></TouchableOpacity> );}} /><View style={styles.footer}><TouchableOpacity style={[styles.button, tempSelectedPlayers.length !== playersPerSide && styles.buttonDisabled]} onPress={confirmPlayingSquad} disabled={tempSelectedPlayers.length !== playersPerSide}><Text style={styles.buttonText}>{t('confirmSquad')}</Text></TouchableOpacity></View></SafeAreaView></Modal>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    scrollViewContent: { padding: 20, paddingBottom: 120 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 30 },
    teamSelectionWrapper: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    card: { flex: 1, marginHorizontal: 10, backgroundColor: '#1F2937', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cardLabel: { color: '#9CA3AF', fontSize: 14, alignSelf: 'flex-start', marginBottom: 10 },
    placeholderContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 20, minHeight: 110 },
    placeholderText: { color: '#9CA3AF', fontSize: 16, marginTop: 10 },
    teamSelectedContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 10, minHeight: 110 },
    teamName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
    selectSquadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 123, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
    selectSquadText: { color: '#007BFF', fontSize: 12, marginRight: 5 },
    vsText: { color: '#9CA3AF', fontSize: 20, fontWeight: 'bold' },
    settingsCard: { backgroundColor: '#1F2937', borderRadius: 16, paddingHorizontal: 20, marginTop: 30 },
    settingsTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 10, paddingVertical: 15 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
    settingTitle: { fontSize: 16, color: '#E5E7EB' },
    stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', borderRadius: 10 },
    stepperButton: { padding: 8 },
    stepperValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF', minWidth: 40, textAlign: 'center' },
    footer: { padding: 20, backgroundColor: 'transparent' },
    button: { backgroundColor: '#16A34A', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#4B5563' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    modalContainer: { flex: 1, backgroundColor: '#111827' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    newTeamButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 10, backgroundColor: 'rgba(22,163,74,0.2)' },
    newTeamButtonText: { color: '#16A34A', fontSize: 16, fontWeight: '600', marginLeft: 10 },
    teamListItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    teamListItemText: { color: '#E5E7EB', fontSize: 18 },
    playerSelectItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937'},
    playerSelectText: { color: '#E5E7EB', fontSize: 18, marginLeft: 15 },
    addPlayerContainer: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    modalInput: { flex: 1, backgroundColor: '#1F2937', color: '#FFF', padding: 15, borderRadius: 10, fontSize: 16 },
    addPlayerButtonModal: { paddingHorizontal: 15, justifyContent: 'center' },
});

export default MatchSetupScreen;