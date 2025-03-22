import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { SignLanguageModelType } from '../services/SignLanguageService';

export default function KSLRecognitionScreen() {
  const [modelStatus, setModelStatus] = useState<'notReady' | 'training' | 'ready'>('notReady');

  // KSL 모델 상태에 따른 화면 표시
  const renderContent = () => {
    switch (modelStatus) {
      case 'notReady':
        return (
          <View style={styles.infoContainer}>
            <Text style={styles.title}>KSL Model Not Available</Text>
            <Text style={styles.description}>
              The Korean Sign Language (KSL) recognition model is currently under development. 
              In this early version, we're planning to collect training data to build a robust model.
            </Text>
            <Image 
              source={require('../../assets/images/ksl_placeholder.png')} 
              style={styles.placeholderImage}
              resizeMode="contain"
            />
            <Text style={styles.infoText}>
              In the meantime, you can use the ASL (American Sign Language) recognition feature 
              which is already available.
            </Text>
          </View>
        );
      
      case 'training':
        return (
          <View style={styles.infoContainer}>
            <Text style={styles.title}>KSL Model is Training</Text>
            <Text style={styles.description}>
              We're currently training the Korean Sign Language model with the collected data.
              This process may take some time to complete.
            </Text>
            <Text style={styles.infoText}>
              Please check back later for updates on the model's availability.
            </Text>
          </View>
        );
      
      case 'ready':
        return (
          <View style={styles.infoContainer}>
            <Text style={styles.title}>KSL Model Ready</Text>
            <Text style={styles.description}>
              The Korean Sign Language model is now ready to use! 
              You can start recognizing KSL signs using the camera.
            </Text>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Start Recognition</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Korean Sign Language</Text>
      </View>
      
      {renderContent()}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.dataCollectionButton}
          onPress={() => {/* Navigate to data collection screen */}}
        >
          <Text style={styles.dataCollectionButtonText}>Contribute Training Data</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Help us improve KSL recognition by contributing training data.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    padding: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#EBEBF5',
    textAlign: 'center',
    marginBottom: 24,
  },
  placeholderImage: {
    width: '80%',
    height: 200,
    marginVertical: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#EBEBF5',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  dataCollectionButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  dataCollectionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    color: '#EBEBF5',
    textAlign: 'center',
  },
}); 