import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    darkMode: false,
    autoPlayTTS: true,
    saveHistory: true,
    highQualityCamera: false,
    serverUrl: 'https://api.sueohaja.com',
  });

  const [isLoading, setIsLoading] = useState(true);

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('설정을 불러오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 설정 저장
  const saveSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem('settings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('설정을 저장하는 중 오류 발생:', error);
      Alert.alert('오류', '설정을 저장하는 중 오류가 발생했습니다.');
    }
  };

  // 토글 스위치 핸들러
  const toggleSwitch = (key) => {
    const newValue = !settings[key];
    saveSettings({ [key]: newValue });
  };

  // 캐시 초기화
  const clearCache = () => {
    Alert.alert(
      '캐시 초기화',
      '모든 캐시와 임시 데이터를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            // 실제 구현에서는 캐시 지우는 로직 추가
            Alert.alert('완료', '캐시가 성공적으로 초기화되었습니다.');
          },
        },
      ],
    );
  };

  // 앱 정보
  const showAppInfo = () => {
    navigation.navigate('About');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>설정을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>일반 설정</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="moon-outline" size={22} color="#4A90E2" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>다크 모드</Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={() => toggleSwitch('darkMode')}
            trackColor={{ false: '#D9D9D9', true: '#4A90E2' }}
            thumbColor={Platform.OS === 'ios' ? '' : settings.darkMode ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="volume-high-outline" size={22} color="#4A90E2" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>자동 음성 출력</Text>
          </View>
          <Switch
            value={settings.autoPlayTTS}
            onValueChange={() => toggleSwitch('autoPlayTTS')}
            trackColor={{ false: '#D9D9D9', true: '#4A90E2' }}
            thumbColor={Platform.OS === 'ios' ? '' : settings.autoPlayTTS ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="save-outline" size={22} color="#4A90E2" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>번역 기록 저장</Text>
          </View>
          <Switch
            value={settings.saveHistory}
            onValueChange={() => toggleSwitch('saveHistory')}
            trackColor={{ false: '#D9D9D9', true: '#4A90E2' }}
            thumbColor={Platform.OS === 'ios' ? '' : settings.saveHistory ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>카메라 설정</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="camera-outline" size={22} color="#4A90E2" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>고화질 카메라 사용</Text>
          </View>
          <Switch
            value={settings.highQualityCamera}
            onValueChange={() => toggleSwitch('highQualityCamera')}
            trackColor={{ false: '#D9D9D9', true: '#4A90E2' }}
            thumbColor={Platform.OS === 'ios' ? '' : settings.highQualityCamera ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>서버 설정</Text>
        
        <View style={styles.serverUrlItem}>
          <View style={styles.settingInfo}>
            <Icon name="server-outline" size={22} color="#4A90E2" style={styles.settingIcon} />
            <Text style={styles.settingLabel}>서버 URL</Text>
          </View>
          <Text style={styles.serverUrl}>{settings.serverUrl}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기타</Text>
        
        <TouchableOpacity style={styles.button} onPress={clearCache}>
          <Icon name="trash-outline" size={22} color="#FF3B30" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: '#FF3B30' }]}>캐시 초기화</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={showAppInfo}>
          <Icon name="information-circle-outline" size={22} color="#4A90E2" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>앱 정보</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>수어 하자 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  serverUrlItem: {
    paddingVertical: 12,
  },
  serverUrl: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginLeft: 34,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  versionInfo: {
    alignItems: 'center',
    marginVertical: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
});

export default SettingsScreen; 