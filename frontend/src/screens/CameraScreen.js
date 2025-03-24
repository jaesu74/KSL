import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_URL } from '../config/api';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [frames, setFrames] = useState([]);
  const [cameraPosition, setCameraPosition] = useState('front');
  
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const devices = useCameraDevices();
  const device = cameraPosition === 'back' ? devices.back : devices.front;
  
  // 카메라 권한 요청
  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
    })();
  }, []);

  // 녹화 시간 카운트다운
  useEffect(() => {
    let interval;
    if (isRecording && countdown !== null) {
      interval = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount <= 1) {
            stopRecording();
            return null;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, countdown]);

  // 수어 번역 시작
  const startRecording = async () => {
    if (cameraRef.current && !isRecording && !isProcessing) {
      setIsRecording(true);
      setCountdown(3); // 3초 녹화
      setFrames([]);
      
      // 실제 구현에서는 여기서 프레임 캡처 시작
      captureFrames();
    }
  };

  // 프레임 캡처
  const captureFrames = async () => {
    // 실제 구현에서는 VisionCamera의 frame processor를 사용
    // 여기서는 예시로 시뮬레이션만 구현
    const intervalId = setInterval(async () => {
      if (!isRecording) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        if (cameraRef.current) {
          const photo = await cameraRef.current.takePhoto({
            quality: 85,
            skipMetadata: true,
          });
          
          // 프레임을 Base64로 변환 (실제 구현에서는 이미지 처리 필요)
          const newFrame = `data:image/jpeg;base64,${photo.base64}`;
          setFrames(prev => [...prev, newFrame]);
        }
      } catch (error) {
        console.error('프레임 캡처 오류:', error);
      }
    }, 100); // 약 10 FPS

    return () => clearInterval(intervalId);
  };

  // 번역 중지
  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // 서버에 프레임 데이터 전송
    processFrames();
  };

  // 프레임 처리 및 서버 요청
  const processFrames = async () => {
    try {
      // 실제 구현에서는 모은 프레임 중 일부를 샘플링하여 전송
      if (frames.length > 0) {
        // 예시 요청 (실제 구현에서는 수정 필요)
        const response = await axios.post(`${API_URL}/api/translate`, {
          frame: frames[0], // 첫 번째 프레임만 전송 (예시)
        });
        
        if (response.data && response.data.predicted_word) {
          // 결과 화면으로 이동
          navigation.navigate('Result', { result: response.data.predicted_word });
        } else {
          Alert.alert(
            '인식 실패',
            '수어를 인식할 수 없습니다. 다시 시도해주세요.',
            [{ text: '확인' }]
          );
        }
      } else {
        Alert.alert(
          '오류',
          '프레임 데이터가 없습니다. 다시 시도해주세요.',
          [{ text: '확인' }]
        );
      }
    } catch (error) {
      console.error('번역 오류:', error);
      Alert.alert(
        '서버 오류',
        '서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 카메라 전환
  const toggleCameraPosition = () => {
    setCameraPosition(currentPosition => 
      currentPosition === 'back' ? 'front' : 'back'
    );
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#4A90E2" /></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>카메라 접근 권한이 필요합니다.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={isFocused}
          photo={true}
          video={false}
          audio={false}
        />
      )}

      <View style={styles.overlay}>
        {/* 안내 영역 */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideText}>
            {isRecording 
              ? `녹화 중... ${countdown}초` 
              : '화면 중앙에 손을 위치시키세요.'}
          </Text>
        </View>

        {/* 컨트롤 영역 */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraPosition}
            disabled={isRecording || isProcessing}
          >
            <Icon name="camera-reverse-outline" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              (isRecording || isProcessing) && styles.captureButtonActive,
            ]}
            onPress={startRecording}
            disabled={isRecording || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View
                style={[
                  styles.captureButtonInner,
                  isRecording && styles.captureButtonInnerActive,
                ]}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.navigate('홈')}
            disabled={isRecording || isProcessing}
          >
            <Icon name="home-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  guideContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(74, 144, 226, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonActive: {
    backgroundColor: '#FF3B30',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  captureButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 5,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CameraScreen; 