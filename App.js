import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { LanguageProvider } from './src/context/LanguageContext'; // Import the provider

const App = () => {
  return (
    // Wrap the entire app with the LanguageProvider
    <LanguageProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </LanguageProvider>
  );
};

export default App;