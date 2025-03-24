import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import theme from '../config/theme';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [gender, setGender] = useState('female');
  const [savedSigns, setSavedSigns] = useState([]);
  const [recentTranslations, setRecentTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState([
    {
      id: '1',
      title: '수어의 기본',
      desc: '수어는 청각 장애인을 위한 시각적 언어입니다. 얼굴 표정과 손동작이 중요해요.',
      image: require('../assets/tip-1.jpg'), // 이미지 추가 필요
    },
    {
      id: '2',
      title: '실시간 번역 팁',
      desc: '번역 시 조명이 밝은 곳에서 손이 잘 보이도록 위치시키세요.',
      image: require('../assets/tip-2.jpg'), // 이미지 추가 필요
    },
    {
      id: '3',
      title: '정확도 높이기',
      desc: '카메라 앞에서 천천히, 또박또박 수어를 표현하면 인식률이 높아집니다.',
      image: require('../assets/tip-3.jpg'), // 이미지 추가 필요
    },
  ]);

  useEffect(() => {
    // 사용자 정보 불러오기
    loadUserData();
    // 최근 번역 기록 불러오기
    loadRecentTranslations();
    // 저장된 수어 불러오기
    loadSavedSigns();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserName(parsedData.name || '사용자');
        setGender(parsedData.gender || 'female');
      }
    } catch (error) {
      console.error('사용자 데이터 로딩 오류:', error);
    }
  };

  const loadRecentTranslations = async () => {
    try {
      setLoading(true);
      
      // AsyncStorage에서 최근 번역 기록 가져오기
      const translations = await AsyncStorage.getItem('recentTranslations');
      
      if (translations) {
        setRecentTranslations(JSON.parse(translations));
      } else {
        // 서버에서 최근 번역 기록 가져오기 (로컬에 없을 경우)
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          const response = await axios.get(`${API_URL}/api/translations/recent`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.translations) {
            setRecentTranslations(response.data.translations);
            await AsyncStorage.setItem('recentTranslations', JSON.stringify(response.data.translations));
          }
        }
      }
    } catch (error) {
      console.error('최근 번역 기록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSigns = async () => {
    try {
      setLoading(true);
      
      // AsyncStorage에서 저장된 수어 가져오기
      const saved = await AsyncStorage.getItem('savedSigns');
      
      if (saved) {
        setSavedSigns(JSON.parse(saved));
      } else {
        // 서버에서 저장된 수어 가져오기 (로컬에 없을 경우)
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          const response = await axios.get(`${API_URL}/api/signs/saved`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.signs) {
            setSavedSigns(response.data.signs);
            await AsyncStorage.setItem('savedSigns', JSON.stringify(response.data.signs));
          }
        }
      }
    } catch (error) {
      console.error('저장된 수어 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    loadRecentTranslations();
    loadSavedSigns();
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            navigation.replace('Auth');
          }
        }
      ]
    );
  };

  const renderTipCard = ({ item }) => (
    <TouchableOpacity style={styles.tipCard}>
      <Image source={item.image} style={styles.tipImage} />
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>{item.title}</Text>
        <Text style={styles.tipDesc}>{item.desc}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSavedSignItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.savedSignItem}
      onPress={() => navigation.navigate('SignDetail', { sign: item })}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.savedSignIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.savedSignIconText}>{item.word.charAt(0)}</Text>
      </LinearGradient>
      <View style={styles.savedSignInfo}>
        <Text style={styles.savedSignWord}>{item.word}</Text>
        <Text style={styles.savedSignDate}>{item.savedAt}</Text>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => playSign(item)}
      >
        <Icon name="play-circle" size={28} color={theme.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentItem}
      onPress={() => navigation.navigate('Result', { result: item.word, annotatedImage: item.image })}
    >
      <View style={styles.recentItemContent}>
        <Text style={styles.recentWord}>{item.word}</Text>
        <Text style={styles.recentDate}>{item.date}</Text>
      </View>
      <View style={styles.recentActions}>
        <TouchableOpacity 
          style={styles.recentActionButton}
          onPress={() => saveTranslation(item)}
        >
          <Icon 
            name={item.isSaved ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={item.isSaved ? theme.colors.primary : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.recentActionButton}
          onPress={() => playAudio(item)}
        >
          <Icon name="volume-high-outline" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // 저장된 수어 재생
  const playSign = (sign) => {
    // 나중에 저장된 수어 시연/재생 기능 구현
    Alert.alert('수어 재생', `'${sign.word}' 수어를 재생합니다.`);
  };

  // 번역 저장
  const saveTranslation = async (translation) => {
    try {
      const updatedTranslations = recentTranslations.map(item => {
        if (item.id === translation.id) {
          return { ...item, isSaved: !item.isSaved };
        }
        return item;
      });
      
      setRecentTranslations(updatedTranslations);
      await AsyncStorage.setItem('recentTranslations', JSON.stringify(updatedTranslations));
      
      // 서버에 저장 상태 업데이트
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await axios.post(
          `${API_URL}/api/translations/${translation.id}/toggle-save`,
          {},
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }
      
      // 저장된 항목을 저장된 수어 목록에도 추가/제거
      if (!translation.isSaved) {
        // 저장되지 않은 상태였다면 저장 목록에 추가
        const newSavedSign = {
          id: translation.id,
          word: translation.word,
          image: translation.image,
          savedAt: new Date().toLocaleDateString(),
        };
        
        const updatedSavedSigns = [...savedSigns, newSavedSign];
        setSavedSigns(updatedSavedSigns);
        await AsyncStorage.setItem('savedSigns', JSON.stringify(updatedSavedSigns));
      } else {
        // 이미 저장된 상태였다면 저장 목록에서 제거
        const updatedSavedSigns = savedSigns.filter(sign => sign.id !== translation.id);
        setSavedSigns(updatedSavedSigns);
        await AsyncStorage.setItem('savedSigns', JSON.stringify(updatedSavedSigns));
      }
    } catch (error) {
      console.error('번역 저장 상태 업데이트 오류:', error);
    }
  };

  // 오디오 재생 (성별에 따라 다른 음성 사용)
  const playAudio = (translation) => {
    // 실제로는 TTS API를 사용하거나 미리 저장된 음성 파일 재생
    Alert.alert('음성 재생', `'${translation.word}'를 ${gender === 'female' ? '여성' : '남성'} 음성으로 재생합니다.`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradient.background}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요,</Text>
            <Text style={styles.userName}>{userName} 님</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="log-out-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* 번역하기 버튼 */}
        <TouchableOpacity
          style={styles.translateButton}
          onPress={() => navigation.navigate('번역하기')}
        >
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={styles.translateButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="camera" size={24} color="#FFF" />
            <Text style={styles.translateButtonText}>수어 번역하기</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 저장된 수어 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내가 저장한 수어</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SavedSigns')}>
              <Text style={styles.sectionLink}>더보기</Text>
            </TouchableOpacity>
          </View>

          {savedSigns.length > 0 ? (
            <FlatList
              data={savedSigns.slice(0, 3)} // 최대 3개만 표시
              renderItem={renderSavedSignItem}
              keyExtractor={(item) => item.id}
              style={styles.savedSignsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="bookmark-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>저장된 수어가 없습니다.</Text>
              <Text style={styles.emptyStateSubText}>번역 후 북마크를 눌러 저장해보세요!</Text>
            </View>
          )}
        </View>

        {/* 최근 번역 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 번역 내역</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.sectionLink}>더보기</Text>
            </TouchableOpacity>
          </View>

          {recentTranslations.length > 0 ? (
            <View style={styles.recentList}>
              {recentTranslations.slice(0, 5).map((item) => (
                <View key={item.id}>
                  {renderRecentItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="time-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateText}>최근 번역 내역이 없습니다.</Text>
              <Text style={styles.emptyStateSubText}>카메라로 수어를 번역해보세요!</Text>
            </View>
          )}
        </View>

        {/* 수어 학습 팁 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수어 학습 팁</Text>
          <FlatList
            data={tips}
            renderItem={renderTipCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsList}
            snapToAlignment="start"
            snapToInterval={CARD_WIDTH + 20}
            decelerationRate="fast"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  userName: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  translateButton: {
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  translateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  translateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionLink: {
    color: theme.colors.secondary,
    fontSize: 14,
  },
  savedSignsList: {
    marginTop: 10,
  },
  savedSignItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ...theme.styles.shadow,
  },
  savedSignIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedSignIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  savedSignInfo: {
    flex: 1,
    marginLeft: 15,
  },
  savedSignWord: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  savedSignDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    padding: 5,
  },
  recentList: {
    marginTop: 5,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recentItemContent: {
    flex: 1,
  },
  recentWord: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  recentDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentActionButton: {
    padding: 8,
    marginLeft: 5,
  },
  tipsList: {
    paddingVertical: 10,
  },
  tipCard: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 16,
    marginRight: 20,
    overflow: 'hidden',
    ...theme.styles.shadow,
  },
  tipImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  tipContent: {
    padding: 15,
  },
  tipTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tipDesc: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 16,
  },
  emptyStateText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptyStateSubText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default HomeScreen; 