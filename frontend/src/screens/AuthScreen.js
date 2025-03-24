import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('female'); // 기본값 여성
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 애니메이션 값
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const logoSize = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // 화면 로딩 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(logoSize, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoSize, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 이미 로그인되어 있는지 확인
    checkLoggedIn();
  }, []);

  // 로그인 상태 확인
  const checkLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        navigation.replace('Main');
      }
    } catch (error) {
      console.log('로그인 상태 확인 오류:', error);
    }
  };

  // 로그인/회원가입 전환 애니메이션
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    
    // 애니메이션 효과
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 로그인 처리
  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // API 호출
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        navigation.replace('Main');
      }
    } catch (error) {
      setError(error.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 처리
  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !name) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // API 호출
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        name,
        gender,
      });
      
      if (response.data.success) {
        // 회원가입 성공 후 로그인 모드로 전환
        setIsLogin(true);
        setError('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setError(error.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 손 아이콘(손 모양 이미지 URL로 대체)
  const HandIcon = () => (
    <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoSize }] }]}>
      <LinearGradient
        colors={theme.colors.gradient.vibrant}
        style={styles.logoGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.appName}>수어랑</Text>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <ImageBackground
      source={require('../assets/auth-background.jpg')} // 배경 이미지 교체 필요
      style={styles.background}
    >
      {/* 배경 그라데이션 오버레이 */}
      <LinearGradient
        colors={['rgba(18, 18, 18, 0.6)', 'rgba(18, 18, 18, 0.85)']}
        style={StyleSheet.absoluteFill}
      />
      
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.authContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <HandIcon />
          
          <Text style={styles.title}>{isLogin ? '로그인' : '회원가입'}</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TextInput
                style={styles.input}
                placeholder="이름"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>성별:</Text>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'female' && styles.genderButtonTextActive,
                  ]}>여성</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'male' && styles.genderButtonTextActive,
                  ]}>남성</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={isLogin ? handleLogin : handleSignup}
            disabled={loading}
          >
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleButton}>
            <Text style={styles.toggleText}>
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    ...theme.styles.shadow,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 30,
  },
  input: {
    ...theme.styles.input,
    width: '100%',
    marginBottom: 15,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  genderLabel: {
    color: theme.colors.text,
    fontSize: 16,
    marginRight: 10,
  },
  genderButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  genderButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderButtonText: {
    color: theme.colors.textSecondary,
  },
  genderButtonTextActive: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
  },
  toggleText: {
    color: theme.colors.secondary,
    fontSize: 14,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default AuthScreen; 