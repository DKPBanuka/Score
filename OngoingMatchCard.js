import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OngoingMatchCard = ({ match }) => (
    <TouchableOpacity style={ongoingCardStyles.ongoingCard}>
        <View style={ongoingCardStyles.cardHeader}>
            <Text style={ongoingCardStyles.liveText}>• LIVE</Text>
            <Ionicons name="chevron-forward-outline" size={22} color="#007BFF" />
        </View>
        <View style={ongoingCardStyles.teamRow}>
            <Text style={ongoingCardStyles.teamName}>{match.teamA}</Text>
            <Text style={ongoingCardStyles.scoreText}>{match.scoreA} <Text style={{fontSize: 14}}>({match.oversA})</Text></Text>
        </View>
        <View style={ongoingCardStyles.vsSeparator}>
            <Text style={ongoingCardStyles.vsText}>vs</Text>
        </View>
        <View style={ongoingCardStyles.teamRow}>
            <Text style={ongoingCardStyles.teamName}>{match.teamB}</Text>
            <Text style={ongoingCardStyles.targetText}>Target: {match.target}</Text>
        </View>
    </TouchableOpacity>
);

const ongoingCardStyles = StyleSheet.create({
    ongoingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#E9ECEF' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    liveText: { color: '#dc3545', fontWeight: 'bold', fontSize: 14 },
    teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    teamName: { fontSize: 18, fontWeight: '600', color: '#343A40' },
    scoreText: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
    vsSeparator: { alignItems: 'center', marginVertical: 8 },
    vsText: { fontSize: 12, color: '#ADB5BD', fontWeight: 'bold' },
    targetText: { fontSize: 14, color: '#6C757D' },
});

export default OngoingMatchCard;
