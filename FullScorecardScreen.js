import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const FullScorecardScreen = ({ route }) => {
    const { matchState, battingTeam, bowlingTeam } = route.params;

    const FallOfWicket = ({ fow, index }) => (
        <Text style={styles.fowText}>{index+1}-{fow.score} ({fow.batsman}, {fow.over.toFixed(1)})</Text>
    );

    return (
        <SafeAreaView style={{flex: 1}}>
            <ScrollView style={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{battingTeam} Innings</Text>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, {flex: 3, textAlign: 'left'}]}>Batsman</Text>
                        <Text style={styles.headerCell}>R</Text>
                        <Text style={styles.headerCell}>B</Text>
                        <Text style={styles.headerCell}>4s</Text>
                        <Text style={styles.headerCell}>6s</Text>
                        <Text style={[styles.headerCell, {flex: 1.5}]}>SR</Text>
                    </View>
                    {matchState.batsmen.map(batsman => (
                        <View key={batsman.id} style={styles.tableRow}>
                            <Text style={[styles.tableCellText, {flex: 3, textAlign: 'left'}]}>{batsman.name}</Text>
                            <Text style={styles.tableCellText}>{batsman.score}</Text>
                            <Text style={styles.tableCellText}>{batsman.balls}</Text>
                            <Text style={styles.tableCellText}>{batsman.fours}</Text>
                            <Text style={styles.tableCellText}>{batsman.sixes}</Text>
                            <Text style={[styles.tableCellText, {flex: 1.5}]}>{(batsman.balls > 0 ? (batsman.score / batsman.balls * 100) : 0).toFixed(2)}</Text>
                        </View>
                    ))}
                    <View style={styles.extrasRow}>
                        <Text style={styles.extrasTitle}>Extras</Text>
                        <Text style={styles.extrasValue}>{Object.values(matchState.extras).reduce((a, b) => a + b, 0)} (wd {matchState.extras.wides}, nb {matchState.extras.noballs}, b {matchState.extras.byes}, lb {matchState.extras.legbyes})</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalTitle}>Total</Text>
                        <Text style={styles.totalValue}>{matchState.score}/{matchState.wickets} ({matchState.overs}.{matchState.balls} Ov)</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{bowlingTeam} Bowling</Text>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, {flex: 3, textAlign: 'left'}]}>Bowler</Text>
                        <Text style={styles.headerCell}>O</Text>
                        <Text style={styles.headerCell}>M</Text>
                        <Text style={styles.headerCell}>R</Text>
                        <Text style={styles.headerCell}>W</Text>
                        <Text style={[styles.headerCell, {flex: 1.5}]}>ER</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCellText, {flex: 3, textAlign: 'left'}]}>{matchState.bowler.name}</Text>
                        <Text style={styles.tableCellText}>{matchState.bowler.overs}</Text>
                        <Text style={styles.tableCellText}>{matchState.bowler.maidens}</Text>
                        <Text style={styles.tableCellText}>{matchState.bowler.runs}</Text>
                        <Text style={styles.tableCellText}>{matchState.bowler.wickets}</Text>
                        <Text style={[styles.tableCellText, {flex: 1.5}]}>{(matchState.bowler.overs > 0 ? (matchState.bowler.runs / matchState.bowler.overs) : 0).toFixed(2)}</Text>
                    </View>
                </View>
                
                {matchState.fallOfWickets && matchState.fallOfWickets.length > 0 &&
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Fall of Wickets</Text>
                        {matchState.fallOfWickets.map((fow, index) => (
                            <FallOfWicket key={index} fow={fow} index={index}/>
                        ))}
                    </View>
                }

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F4F4',
    },
    section: {
        backgroundColor: '#FFFFFF',
        margin: 10,
        borderRadius: 8,
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
        paddingBottom: 8,
        marginBottom: 5,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        color: '#888',
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        alignItems: 'center',
    },
    tableCellText: {
        flex: 1,
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    extrasRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EAEAEA',
    },
    extrasTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    extrasValue: {
        fontSize: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 2,
        borderTopColor: '#333',
    },
    totalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    fowText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 4,
    }
});

export default FullScorecardScreen;
