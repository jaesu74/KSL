import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AboutScreen = () => {
  // 웹사이트 링크 열기
  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('링크를 열 수 없습니다:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/images/app-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>수어 하자</Text>
        <Text style={styles.version}>버전 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 소개</Text>
        <Text style={styles.description}>
          수어 하자는 한국어 수화(수어)를 인식하여 텍스트와 음성으로 변환해주는 앱입니다. 
          청각장애인과의 원활한 의사소통을 돕기 위해 개발되었으며, 실시간 수어 번역 기능을 제공합니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>사용 방법</Text>
        
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.numberText}>1</Text>
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>카메라 준비</Text>
            <Text style={styles.instructionDescription}>
              하단 탭에서 번역하기 버튼을 누르고 카메라 접근 권한을 허용합니다.
            </Text>
          </View>
        </View>
        
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.numberText}>2</Text>
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>수어 표현하기</Text>
            <Text style={styles.instructionDescription}>
              카메라 화면 중앙에 손을 위치시키고 번역하고자 하는 수어를 표현합니다.
            </Text>
          </View>
        </View>
        
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.numberText}>3</Text>
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>번역 확인</Text>
            <Text style={styles.instructionDescription}>
              수어가 인식되면 텍스트로 변환됩니다. 음성으로 듣기 버튼을 눌러 음성으로도 확인할 수 있습니다.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기술 정보</Text>
        <Text style={styles.description}>
          이 앱은 React Native로 개발되었으며, 딥러닝 기반의 한국어 수어 번역 모델을 사용합니다. 
          MediaPipe와 TensorFlow를 활용한 손 동작 인식 알고리즘을 통해 실시간 번역을 제공합니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>연락처</Text>
        
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => openLink('mailto:support@sueohaja.com')}
        >
          <Icon name="mail-outline" size={24} color="#4A90E2" style={styles.contactIcon} />
          <Text style={styles.contactText}>support@sueohaja.com</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => openLink('https://www.sueohaja.com')}
        >
          <Icon name="globe-outline" size={24} color="#4A90E2" style={styles.contactIcon} />
          <Text style={styles.contactText}>www.sueohaja.com</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.copyright}>© 2023 수어 하자. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: 'white',
    fontWeight: 'bold',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  copyright: {
    fontSize: 14,
    color: '#999',
  },
});

export default AboutScreen; 