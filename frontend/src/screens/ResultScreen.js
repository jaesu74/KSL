import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';

const ResultScreen = ({ route, navigation }) => {
  const { result } = route.params || { result: '' };
  const [translatedText, setTranslatedText] = useState(result);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // TTS 초기화
  useEffect(() => {
    Tts.setDefaultLanguage('ko-KR');
    Tts.addEventListener('tts-start', () => setIsSpeaking(true));
    Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));

    return () => {
      Tts.stop();
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []);

  // 음성 재생
  const speakText = () => {
    if (translatedText.trim() === '') {
      Alert.alert('알림', '읽을 텍스트가 없습니다.');
      return;
    }

    if (isSpeaking) {
      Tts.stop();
    } else {
      Tts.speak(translatedText);
    }
  };

  // 텍스트 복사
  const copyToClipboard = () => {
    if (translatedText.trim() === '') {
      Alert.alert('알림', '복사할 텍스트가 없습니다.');
      return;
    }

    // 실제 구현에서는 Clipboard 모듈 사용
    Alert.alert('성공', '텍스트가 클립보드에 복사되었습니다.');
  };

  // 번역 결과 재시도
  const retryTranslation = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>번역 결과</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#4A90E2" />
          ) : (
            <>
              <Text style={styles.resultText}>{translatedText}</Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={speakText}
                >
                  <Icon
                    name={isSpeaking ? 'volume-mute' : 'volume-high'}
                    size={24}
                    color="#4A90E2"
                  />
                  <Text style={styles.actionButtonText}>
                    {isSpeaking ? '음성 중지' : '음성으로 듣기'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={copyToClipboard}
                >
                  <Icon name="copy-outline" size={24} color="#4A90E2" />
                  <Text style={styles.actionButtonText}>텍스트 복사</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>최근 번역 기록</Text>
          {/* 실제 구현에서는 AsyncStorage 등을 사용해 기록 저장 및 표시 */}
          <Text style={styles.emptyText}>번역 기록이 없습니다.</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={retryTranslation}
        >
          <Icon name="refresh" size={20} color="white" />
          <Text style={styles.bottomButtonText}>다시 번역하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomButton, styles.homeButton]}
          onPress={() => navigation.navigate('홈')}
        >
          <Icon name="home" size={20} color="white" />
          <Text style={styles.bottomButtonText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  contentContainer: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultText: {
    fontSize: 24,
    color: '#111',
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '500',
  },
  historySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 15,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  homeButton: {
    backgroundColor: '#6C7A89',
  },
  bottomButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ResultScreen; 