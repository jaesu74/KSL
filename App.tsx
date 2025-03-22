import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [isTfReady, setIsTfReady] = useState(false);

  // TensorFlow.js 초기화
  useEffect(() => {
    const setupTf = async () => {
      try {
        await tf.ready();
        setIsTfReady(true);
        console.log('TensorFlow.js is ready');
      } catch (error) {
        console.error('Failed to load TensorFlow', error);
      }
    };

    setupTf();
  }, []);

  // TensorFlow가 로드되지 않았을 때 로딩 화면 표시
  if (!isTfReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading TensorFlow.js...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
}); 