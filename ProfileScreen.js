import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native'; // ScrollView added
import { Ionicons } from '@expo/vector-icons';

const StatCard = ({icon, label, value}) => (
    <View style={profileStyles.statCard}>
        <Ionicons name={icon} size={28} color="#007BFF" />
        <Text style={profileStyles.statValue}>{value}</Text>
        <Text style={profileStyles.statLabel}>{label}</Text>
    </View>
);

const SettingRow = ({icon, label, onPress}) => (
    <TouchableOpacity style={profileStyles.settingRow} onPress={onPress}>
        <Ionicons name={icon} size={24} color="#9CA3AF" style={{marginRight: 20}}/>
        <Text style={profileStyles.settingLabel}>{label}</Text>
        <Ionicons name="chevron-forward-outline" size={22} color="#9CA3AF" />
    </TouchableOpacity>
);

const ProfileScreen = () => {
    return (
        <SafeAreaView style={profileStyles.container}>
            <ScrollView>
                <View style={profileStyles.profileHeader}>
                    <View style={profileStyles.avatar}>
                        <Ionicons name="person-outline" size={60} color="#1F2937" />
                    </View>
                    <Text style={profileStyles.userName}>Guest User</Text>
                    <Text style={profileStyles.userEmail}>guest@scoremachan.com</Text>
                </View>

                <View style={profileStyles.statsContainer}>
                    <StatCard icon="stats-chart-outline" label="Matches" value="0"/>
                    <StatCard icon="trophy-outline" label="Wins" value="0"/>
                    <StatCard icon="analytics-outline" label="Win %" value="0%"/>
                </View>

                <View style={profileStyles.settingsSection}>
                    <SettingRow icon="person-circle-outline" label="Account Details"/>
                    <SettingRow icon="color-palette-outline" label="Appearance"/>
                    <SettingRow icon="notifications-outline" label="Notifications"/>
                    <SettingRow icon="log-out-outline" label="Logout" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const profileStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    profileHeader: { alignItems: 'center', padding: 30 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    userEmail: { fontSize: 16, color: '#9CA3AF', marginTop: 5 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: '#1F2937', padding: 20, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginTop: 8 },
    statLabel: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
    settingsSection: { marginHorizontal: 20, backgroundColor: '#1F2937', borderRadius: 12 },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)'},
    settingLabel: { flex: 1, fontSize: 16, color: '#E5E7EB' },
});

export default ProfileScreen;
