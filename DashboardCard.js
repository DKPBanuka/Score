import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DashboardCard = ({ title, subtitle, iconName, onPress, color }) => (
  <TouchableOpacity style={[dashboardStyles.dashboardCard, { backgroundColor: color || '#FFF' }]} onPress={onPress}>
    <Ionicons name={iconName} size={30} color={color ? '#FFF' : '#333'} />
    <Text style={[dashboardStyles.dashboardCardTitle, { color: color ? '#FFF' : '#333' }]}>{title}</Text>
    <Text style={[dashboardStyles.dashboardCardSubtitle, { color: color ? '#FFF' : '#333' }]}>{subtitle}</Text>
  </TouchableOpacity>
);

const dashboardStyles = StyleSheet.create({
    dashboardCard: { width: '48%', borderRadius: 16, padding: 20, marginBottom: 15, alignItems: 'flex-start', borderWidth: 1, borderColor: '#E9ECEF' },
    dashboardCardTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
    dashboardCardSubtitle: { fontSize: 12, color: '#6c757d', marginTop: 4 },
});

export default DashboardCard;