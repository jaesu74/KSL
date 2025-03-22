import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>KSL Interpreter</Text>
        <Text style={styles.subtitle}>Korean Sign Language Interpreter</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.featureContainer}>
          <Text style={styles.sectionTitle}>Choose a Sign Language</Text>
          
          {/* ASL 카드 */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('ASLRecognition')}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>American Sign Language</Text>
                <Text style={styles.cardDescription}>
                  Recognize ASL alphabet gestures and translate them to text.
                </Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusIndicator, styles.statusReady]} />
                  <Text style={styles.statusText}>Ready</Text>
                </View>
              </View>
              <Image 
                source={require('../../assets/images/asl_placeholder.png.txt')} 
                style={styles.cardImage}
              />
            </View>
          </TouchableOpacity>
          
          {/* KSL 카드 */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('KSLRecognition')}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Korean Sign Language</Text>
                <Text style={styles.cardDescription}>
                  Recognize KSL gestures and translate them to text.
                </Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusIndicator, styles.statusDevelopment]} />
                  <Text style={styles.statusText}>In Development</Text>
                </View>
              </View>
              <Image 
                source={require('../../assets/images/ksl_placeholder.png.txt')} 
                style={styles.cardImage}
              />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.aboutContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              KSL Interpreter is an application designed to help bridge communication gaps by translating sign language to text.
            </Text>
            <Text style={styles.aboutText}>
              Currently supporting ASL with KSL in development, this app aims to be a comprehensive tool for sign language translation.
            </Text>
            <Text style={styles.aboutText}>
              Use the camera to capture hand gestures and see them translated in real-time.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#EBEBF5',
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  featureContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#EBEBF5',
    marginBottom: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#3A3A3C',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusReady: {
    backgroundColor: '#30D158',
  },
  statusDevelopment: {
    backgroundColor: '#FF9F0A',
  },
  statusText: {
    fontSize: 12,
    color: '#EBEBF5',
  },
  aboutContainer: {
    padding: 16,
    marginBottom: 16,
  },
  aboutCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#EBEBF5',
    marginBottom: 12,
    lineHeight: 20,
  },
}); 