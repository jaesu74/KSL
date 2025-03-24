import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';
import * as Speech from 'expo-speech';

const ResultScreen = ({ route, navigation }) => {
  const { result, annotatedImage } = route.params;
  const [isSaved, setIsSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gender, setGender] = useState('female');
  const [loading, setLoading] = useState(false);
  const [translationId, setTranslationId] = useState(null);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // 결과 로드 시 사용자 설정 및 번역 정보 가져오기
    loadUserInfo();
    saveTranslationToHistory();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        setGender(parsedData.gender || 'female');
      }
      
      if (token) {
        setUserToken(token);
      }
    } catch (error) {
      console.error('사용자 정보 로드 오류:', error);
    }
  };

  // 번역 결과를 히스토리에 저장
  const saveTranslationToHistory = async () => {
    try {
      setLoading(true);
      
      // 로컬 저장
      const now = new Date();
      const translationItem = {
        id: now.getTime().toString(),
        word: result,
        image: annotatedImage,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        isSaved: false,
      };
      
      setTranslationId(translationItem.id);
      
      // 이전 번역 내역 가져오기
      const existingData = await AsyncStorage.getItem('recentTranslations');
      let translations = [];
      
      if (existingData) {
        translations = JSON.parse(existingData);
      }
      
      // 최근 항목을 앞에 추가 (최대 20개 유지)
      translations = [translationItem, ...translations];
      if (translations.length > 20) {
        translations = translations.slice(0, 20);
      }
      
      await AsyncStorage.setItem('recentTranslations', JSON.stringify(translations));
      
      // 서버에도 저장
      if (userToken) {
        const response = await axios.post(
          `${API_URL}/api/translations`,
          {
            word: result,
            image: annotatedImage
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        
        if (response.data.id) {
          setTranslationId(response.data.id);
        }
      }
    } catch (error) {
      console.error('번역 저장 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 번역 결과 저장 상태 토글
  const toggleSaveStatus = async () => {
    try {
      setIsSaved(!isSaved);
      
      // 로컬 저장소 업데이트
      const existingData = await AsyncStorage.getItem('recentTranslations');
      if (existingData) {
        let translations = JSON.parse(existingData);
        
        translations = translations.map((item) => {
          if (item.id === translationId) {
            return { ...item, isSaved: !isSaved };
          }
          return item;
        });
        
        await AsyncStorage.setItem('recentTranslations', JSON.stringify(translations));
      }
      
      // 서버 저장 상태 업데이트
      if (userToken && translationId) {
        await axios.post(
          `${API_URL}/api/translations/${translationId}/toggle-save`,
          {},
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
      }
      
      // 저장 목록 업데이트
      const savedData = await AsyncStorage.getItem('savedSigns');
      let savedSigns = [];
      
      if (savedData) {
        savedSigns = JSON.parse(savedData);
      }
      
      if (!isSaved) {
        // 저장 목록에 추가
        const newSavedSign = {
          id: translationId,
          word: result,
          image: annotatedImage,
          savedAt: new Date().toLocaleDateString(),
        };
        
        savedSigns = [newSavedSign, ...savedSigns];
        await AsyncStorage.setItem('savedSigns', JSON.stringify(savedSigns));
        
        Alert.alert('저장 완료', '번역 결과가 저장되었습니다.');
      } else {
        // 저장 목록에서 제거
        savedSigns = savedSigns.filter(sign => sign.id !== translationId);
        await AsyncStorage.setItem('savedSigns', JSON.stringify(savedSigns));
        
        Alert.alert('저장 취소', '번역 결과 저장이 취소되었습니다.');
      }
    } catch (error) {
      console.error('저장 상태 변경 오류:', error);
      setIsSaved(!isSaved); // 실패 시 상태 되돌리기
    }
  };

  // 음성 재생
  const playAudio = async () => {
    try {
      setIsPlaying(true);
      
      // expo-speech를 사용한 TTS
      const voiceOptions = {
        language: 'ko-KR',
        pitch: 1.0,
        rate: 0.8,
        // gender에 따라 voice 설정 (iOS만 지원, Android는 기본 음성 사용)
        voice: gender === 'female' ? 'com.apple.ttsbundle.Yuna-compact' : 'com.apple.ttsbundle.Hattori-compact',
      };
      
      Speech.speak(result, {
        ...voiceOptions,
        onDone: () => setIsPlaying(false),
        onError: () => {
          console.error('TTS 오류 발생');
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('음성 재생 오류:', error);
      setIsPlaying(false);
    }
  };

  // 공유 기능
  const shareResult = async () => {
    try {
      await Share.share({
        message: `수어랑에서 번역한 내용: ${result}`,
      });
    } catch (error) {
      console.error('공유 오류:', error);
    }
  };

  // 다시 번역하기
  const translateAgain = () => {
    navigation.navigate('번역하기');
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradient.background}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>번역 결과</Text>
      </LinearGradient>
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <>
            <View style={styles.resultCard}>
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.resultHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.resultHeaderText}>인식된 수어</Text>
              </LinearGradient>
              
              <View style={styles.resultContent}>
                <Text style={styles.resultText}>{result}</Text>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={toggleSaveStatus}
                  >
                    <Icon 
                      name={isSaved ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={isSaved ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.actionButtonText,
                      isSaved && { color: theme.colors.primary }
                    ]}>
                      {isSaved ? '저장됨' : '저장'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={playAudio}
                    disabled={isPlaying}
                  >
                    <Icon 
                      name={isPlaying ? "volume-high" : "volume-high-outline"} 
                      size={24} 
                      color={isPlaying ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.actionButtonText,
                      isPlaying && { color: theme.colors.primary }
                    ]}>
                      {isPlaying ? '재생 중...' : '읽기'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={shareResult}
                  >
                    <Icon name="share-social-outline" size={24} color={theme.colors.textSecondary} />
                    <Text style={styles.actionButtonText}>공유</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {annotatedImage && (
              <View style={styles.imageCard}>
                <Text style={styles.imageTitle}>손 인식 결과</Text>
                <Image
                  source={{ uri: annotatedImage }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            <TouchableOpacity
              style={styles.translateAgainButton}
              onPress={translateAgain}
            >
              <LinearGradient
                colors={theme.colors.gradient.secondary}
                style={styles.translateAgainGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="camera-outline" size={20} color="#FFF" />
                <Text style={styles.translateAgainText}>다시 번역하기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loader: {
    marginTop: 50,
  },
  resultCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...theme.styles.shadow,
  },
  resultHeader: {
    padding: 16,
    alignItems: 'center',
  },
  resultHeaderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContent: {
    padding: 20,
  },
  resultText: {
    fontSize: 24,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.textSecondary,
    marginTop: 5,
    fontSize: 12,
  },
  imageCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...theme.styles.shadow,
  },
  imageTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  translateAgainButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
  },
  translateAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  translateAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ResultScreen; 