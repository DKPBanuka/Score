import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MatchSummaryScreen = ({ route, navigation }) => {
    const { result } = route.params;

    return (
        <View style={styles.container}>
            <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Ionicons name="trophy" size={120} color="#FFD700" />
                <Text style={styles.title}>MATCH OVER</Text>
                <Text style={styles.resultText}>{result}</Text>
                <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
                    <Text style={styles.buttonText}>BACK TO HOME</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1F2937',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 20,
        marginBottom: 10,
    },
    resultText: {
        fontSize: 22,
        color: '#E5E7EB',
        textAlign: 'center',
        marginHorizontal: 20,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MatchSummaryScreen;