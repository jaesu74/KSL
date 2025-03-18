import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const startCamera = () => {
    navigation.navigate('Camera');
  };

  const openSettings = () => {
    navigation.navigate('Settings');
  };

  const openHelp = () => {
    Alert.alert(
      '도움말',
      '이 앱은 한국 수화를 인식하여 텍스트와 음성으로 변환해 주는 앱입니다.\n\n' +
      '1. 카메라 버튼을 눌러 수화 인식을 시작하세요.\n' +
      '2. 수화를 촬영하면 자동으로 해석합니다.\n' +
      '3. 설정에서 언어와 기타 옵션을 변경할 수 있습니다.'
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>수화 통역사</Text>
        <Text style={styles.subtitle}>한국 수화 인식 & 번역</Text>
      </View>

      <View style={styles.imageContainer}>
        {/* 실제 앱에서는 적절한 이미지로 교체 필요 */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>수화 이미지</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={startCamera}>
          <Text style={styles.primaryButtonText}>카메라 시작</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtonsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={openSettings}>
            <Text style={styles.secondaryButtonText}>설정</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={openHelp}>
            <Text style={styles.secondaryButtonText}>도움말</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>앱 소개</Text>
        <Text style={styles.infoText}>
          '수화 통역사'는 한국어 수화를 실시간으로 인식하여 텍스트와 음성으로 번역해주는 앱입니다.
          인공지능 기술을 활용하여 높은 정확도로 수화를 해석하며, 향후 다양한 언어의 수화로 
          확장될 예정입니다.
        </Text>
        
        <Text style={styles.infoTitle}>사용 방법</Text>
        <Text style={styles.infoText}>
          1. '카메라 시작' 버튼을 누릅니다.
          2. 수화를 보여주는 사람을 카메라로 촬영합니다.
          3. 앱이 자동으로 수화를 인식하여 텍스트로 표시합니다.
          4. 필요시 음성으로 들을 수 있습니다.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 수화 통역사</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 5,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#6B7280',
    fontSize: 16,
  },
  buttonContainer: {
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 15,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default HomeScreen; 