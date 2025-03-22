import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';

// 스크린 임포트
import HomeScreen from '../screens/HomeScreen';
import ASLRecognitionScreen from '../screens/ASLRecognitionScreen';
import KSLRecognitionScreen from '../screens/KSLRecognitionScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1C1C1E',
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: { backgroundColor: '#1C1C1E' }
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ASLRecognition" 
          component={ASLRecognitionScreen} 
          options={{ title: 'ASL Recognition' }}
        />
        <Stack.Screen 
          name="KSLRecognition" 
          component={KSLRecognitionScreen} 
          options={{ title: 'KSL Recognition' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 