import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// 스크린 임포트
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563EB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '수화 통역사',
          }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: '수화 인식',
            headerBackTitle: '뒤로',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: '설정',
            headerBackTitle: '뒤로',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 