import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../context/LanguageContext'; // Assuming you have this context file

// Import All Screens
import HomeScreen from '../screens/HomeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import TournamentsScreen from '../screens/TournamentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TeamsScreen from '../screens/TeamsScreen';
import CreateTeamScreen from '../screens/CreateTeamScreen';
import CreateTournamentScreen from '../screens/CreateTournamentScreen';
import TournamentDashboardScreen from '../screens/TournamentDashboardScreen';
import AddTeamsScreen from '../screens/AddTeamsScreen';
import FixturesScreen from '../screens/FixturesScreen';
import MatchSetupScreen from '../screens/MatchSetupScreen';
import TossScreen from '../screens/TossScreen';
import ScoringScreen from '../screens/ScoringScreen';
import FullScorecardScreen from '../screens/FullScorecardScreen';
import MatchSummaryScreen from '../screens/MatchSummaryScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- Language Toggle Button Component ---
const LanguageToggle = () => {
    const { locale, setLocale } = useTranslation();
    const toggleLocale = () => {
        setLocale(locale === 'en' ? 'si' : 'en');
    };
    return (
        <TouchableOpacity onPress={toggleLocale} style={{ marginRight: 15 }}>
            <Ionicons name="language-outline" size={26} color="#FFF" />
        </TouchableOpacity>
    );
};

// --- Bottom Tab Navigator ---
const MainTabNavigator = () => {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
              else if (route.name === 'Matches') iconName = focused ? 'list-circle' : 'list-circle-outline';
              else if (route.name === 'Teams') iconName = focused ? 'people' : 'people-outline';
              else if (route.name === 'Tournaments') iconName = focused ? 'trophy' : 'trophy-outline';
              else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007BFF',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: { backgroundColor: '#1F2937', borderTopColor: 'rgba(255,255,255,0.1)'},
            // The header is now part of the tab navigator screens
            headerStyle: { backgroundColor: '#1F2937' },
            headerTintColor: '#FFF',
            headerTitleStyle: { fontWeight: 'bold' },
            headerRight: () => <LanguageToggle />,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('home'), title: 'Score මචං' }} />
          <Tab.Screen name="Matches" component={MatchesScreen} options={{ tabBarLabel: t('matches'), title: t('myMatches') }} />
          <Tab.Screen name="Teams" component={TeamsScreen} options={{ tabBarLabel: t('teams'), title: t('myTeams') }} />
          <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: t('tournaments'), title: t('myTournaments') }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('profile'), title: t('myProfile') }} />
        </Tab.Navigator>
    );
};

// --- Main App Stack Navigator ---
const AppNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#1F2937' },
                headerTintColor: '#FFF',
                headerTitleStyle: { fontWeight: 'bold' },
                headerBackTitleVisible: false,
                headerRight: () => <LanguageToggle />,
            }}
        >
            {/* The first screen is the Tab Navigator. It should NOT have a header from the Stack Navigator. */}
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
              options={{ headerShown: false }}
            />
            
            {/* All other screens are part of the stack */}
            <Stack.Screen name="MatchSetup" component={MatchSetupScreen} options={{ title: 'New Match' }} />
            <Stack.Screen name="Toss" component={TossScreen} options={{ title: 'Coin Toss' }} />
            <Stack.Screen name="Scoring" component={ScoringScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FullScorecard" component={FullScorecardScreen} options={{ title: 'Full Scorecard' }} />
            <Stack.Screen name="MatchSummary" component={MatchSummaryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} options={({ route }) => ({ title: route.params?.isEdit ? 'Edit Tournament' : 'Create Tournament' })} />
            <Stack.Screen name="TournamentDashboard" component={TournamentDashboardScreen} options={({ route }) => ({ title: route.params?.tournamentName || 'Tournament' })} />
            <Stack.Screen name="AddTeams" component={AddTeamsScreen} options={{ title: 'Add Teams' }} />
            <Stack.Screen name="Fixtures" component={FixturesScreen} options={{ title: 'Fixtures' }} />
            <Stack.Screen 
                name="CreateTeam" 
                component={CreateTeamScreen} 
                options={({ route }) => ({ 
                    title: route.params?.isEdit ? 'Edit Team' : 'Create New Team' 
                })} 
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;