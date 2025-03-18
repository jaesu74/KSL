import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import signLanguageService, { SupportedLanguage } from '../services/SignLanguageService';

const SettingsScreen = () => {
  const [useSpeech, setUseSpeech] = useState<boolean>(true);
  const [useHighAccuracy, setUseHighAccuracy] = useState<boolean>(false);
  const [language, setLanguage] = useState<SupportedLanguage>('korean');
  const [autoSave, setAutoSave] = useState<boolean>(true);
  const [languageStatus, setLanguageStatus] = useState<Record<SupportedLanguage, boolean>>({
    korean: true,
    english: false,
    japanese: false,
    chinese: false
  });

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const speechSetting = await AsyncStorage.getItem('useSpeech');
        const accuracySetting = await AsyncStorage.getItem('useHighAccuracy');
        const languageSetting = await AsyncStorage.getItem('language') as SupportedLanguage | null;
        const autoSaveSetting = await AsyncStorage.getItem('autoSave');

        if (speechSetting !== null) setUseSpeech(speechSetting === 'true');
        if (accuracySetting !== null) setUseHighAccuracy(accuracySetting === 'true');
        if (languageSetting !== null) {
          setLanguage(languageSetting);
          // 수화 인식 서비스에도 언어 설정 적용
          signLanguageService.setLanguage(languageSetting);
        }
        if (autoSaveSetting !== null) setAutoSave(autoSaveSetting === 'true');
        
        // 언어 지원 상태 업데이트
        const status = signLanguageService.getLanguageStatus();
        setLanguageStatus(status);
      } catch (error) {
        console.error('설정을 불러오는 중 오류 발생:', error);
        Alert.alert('오류', '설정을 불러오는데 실패했습니다.');
      }
    };

    loadSettings();
  }, []);

  // 설정 저장
  const saveSettings = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('설정을 저장하는 중 오류 발생:', error);
      Alert.alert('오류', '설정을 저장하는데 실패했습니다.');
    }
  };

  const toggleSpeech = () => {
    const newValue = !useSpeech;
    setUseSpeech(newValue);
    saveSettings('useSpeech', newValue.toString());
  };

  const toggleAccuracy = () => {
    const newValue = !useHighAccuracy;
    setUseHighAccuracy(newValue);
    saveSettings('useHighAccuracy', newValue.toString());
  };

  const toggleAutoSave = () => {
    const newValue = !autoSave;
    setAutoSave(newValue);
    saveSettings('autoSave', newValue.toString());
  };

  const selectLanguage = (lang: SupportedLanguage) => {
    // 지원되지 않는 언어인 경우 선택 불가
    if (!languageStatus[lang]) {
      Alert.alert('준비 중', `현재 ${getLanguageDisplayName(lang)} 수화는 지원하지 않습니다. 곧 지원할 예정입니다.`);
      return;
    }
    
    setLanguage(lang);
    saveSettings('language', lang);
    
    // 수화 인식 서비스에도 언어 설정 적용
    signLanguageService.setLanguage(lang);
  };

  // 언어 코드에 해당하는 표시 이름 반환
  const getLanguageDisplayName = (code: SupportedLanguage): string => {
    const names: Record<SupportedLanguage, string> = {
      korean: '한국어',
      english: '영어',
      japanese: '일본어',
      chinese: '중국어'
    };
    return names[code];
  };

  const clearData = () => {
    Alert.alert(
      '데이터 초기화',
      '저장된 모든 데이터를 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          onPress: async () => {
            try {
              // 필요한 키만 유지하고 나머지 데이터 삭제
              const settings = {
                useSpeech: useSpeech.toString(),
                useHighAccuracy: useHighAccuracy.toString(),
                language,
                autoSave: autoSave.toString(),
              };
              
              await AsyncStorage.clear();
              
              // 설정 다시 저장
              for (const [key, value] of Object.entries(settings)) {
                await AsyncStorage.setItem(key, value);
              }
              
              Alert.alert('완료', '모든 데이터가 초기화되었습니다.');
            } catch (error) {
              console.error('데이터 초기화 중 오류 발생:', error);
              Alert.alert('오류', '데이터를 초기화하는데 실패했습니다.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>일반 설정</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>음성 출력</Text>
          <Switch
            value={useSpeech}
            onValueChange={toggleSpeech}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useSpeech ? '#2563EB' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>고정밀 인식 모드</Text>
          <Switch
            value={useHighAccuracy}
            onValueChange={toggleAccuracy}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useHighAccuracy ? '#2563EB' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>결과 자동 저장</Text>
          <Switch
            value={autoSave}
            onValueChange={toggleAutoSave}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoSave ? '#2563EB' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>언어 설정</Text>
        <Text style={styles.description}>
          다양한 국가의 수화를 지원합니다. 현재 한국어 수화와 영어 수화(베타)를 지원합니다.
        </Text>
        
        {/* 한국어 - 기본 지원 */}
        <TouchableOpacity
          style={[styles.languageOption, language === 'korean' && styles.selectedLanguage]}
          onPress={() => selectLanguage('korean')}
        >
          <Text style={language === 'korean' ? styles.selectedLanguageText : styles.languageOptionText}>
            한국어 {languageStatus.korean ? '' : '(준비 중)'}
          </Text>
        </TouchableOpacity>
        
        {/* 영어 - 베타 지원 */}
        <TouchableOpacity
          style={[
            styles.languageOption, 
            language === 'english' && styles.selectedLanguage,
            !languageStatus.english && styles.disabledLanguage
          ]}
          onPress={() => selectLanguage('english')}
        >
          <Text 
            style={[
              language === 'english' ? styles.selectedLanguageText : styles.languageOptionText,
              !languageStatus.english && styles.disabledLanguageText
            ]}
          >
            영어 {languageStatus.english ? '(베타)' : '(준비 중)'}
          </Text>
        </TouchableOpacity>
        
        {/* 일본어 - 미지원 */}
        <TouchableOpacity
          style={[
            styles.languageOption, 
            language === 'japanese' && styles.selectedLanguage,
            !languageStatus.japanese && styles.disabledLanguage
          ]}
          onPress={() => selectLanguage('japanese')}
        >
          <Text 
            style={[
              language === 'japanese' ? styles.selectedLanguageText : styles.languageOptionText,
              !languageStatus.japanese && styles.disabledLanguageText
            ]}
          >
            일본어 {languageStatus.japanese ? '' : '(준비 중)'}
          </Text>
        </TouchableOpacity>
        
        {/* 중국어 - 미지원 */}
        <TouchableOpacity
          style={[
            styles.languageOption, 
            language === 'chinese' && styles.selectedLanguage,
            !languageStatus.chinese && styles.disabledLanguage
          ]}
          onPress={() => selectLanguage('chinese')}
        >
          <Text 
            style={[
              language === 'chinese' ? styles.selectedLanguageText : styles.languageOptionText,
              !languageStatus.chinese && styles.disabledLanguageText
            ]}
          >
            중국어 {languageStatus.chinese ? '' : '(준비 중)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>데이터 관리</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={clearData}>
          <Text style={styles.dangerButtonText}>데이터 초기화</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          이 옵션은 앱에 저장된 모든 인식 기록과 사용자 데이터를 삭제합니다.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <Text style={styles.infoText}>수화 통역사</Text>
        <Text style={styles.infoText}>버전: 1.0.0</Text>
        <Text style={styles.infoText}>© 2024 수화 통역사</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  languageOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },
  selectedLanguage: {
    backgroundColor: '#2563EB',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#4B5563',
  },
  selectedLanguageText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  disabledLanguage: {
    opacity: 0.6,
  },
  disabledLanguageText: {
    color: '#9CA3AF',
  },
  dangerButton: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },
});

export default SettingsScreen; 