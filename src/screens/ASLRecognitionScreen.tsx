import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as Speech from 'expo-speech';
import { 
  signLanguageService,
  RecognitionThreshold,
  CameraState,
  DELETE_ACTION,
  SPACE_ACTION
} from '../services/SignLanguageService';

const TensorCamera = cameraWithTensors(Camera);

// 텐서플로우 카메라 설정
const textureDims = { width: 1080, height: 1920 };
const tensorDims = { width: 152, height: 200 };

export default function ASLRecognitionScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraState, setCameraState] = useState(CameraState.IDLE);
  const [currentSentence, setCurrentSentence] = useState('');
  const [currentDetectedSign, setCurrentDetectedSign] = useState<string | null>(null);
  const [detectionStartTime, setDetectionStartTime] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(RecognitionThreshold.BEGINNER);

  const rafId = useRef<number | null>(null);
  const letterStartTime = useRef<number | null>(null);

  // 권한 요청 및 텐서플로우 초기화
  useEffect(() => {
    async function setupCamera() {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        setCameraState(CameraState.PERMISSION_DENIED);
        return;
      }

      try {
        // TensorFlow 초기화
        await tf.ready();
        setCameraState(CameraState.READY);
      } catch (error) {
        console.error('Error setting up TensorFlow:', error);
        setCameraState(CameraState.NOT_FOUND);
      } finally {
        setIsLoading(false);
      }
    }

    setupCamera();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  // 텍스트를 음성으로 변환
  const speakText = (text: string) => {
    if (text.trim().length > 0) {
      Speech.speak(text);
    }
  };

  // 인식된 글자 추가
  const addLetter = (letter: string) => {
    if (letter === DELETE_ACTION) {
      setCurrentSentence(prev => prev.slice(0, -1));
    } else if (letter === SPACE_ACTION) {
      setCurrentSentence(prev => prev + ' ');
    } else {
      setCurrentSentence(prev => prev + letter);
    }
  };

  // 문장 초기화
  const resetSentence = () => {
    setCurrentSentence('');
  };

  // 프레임 처리 함수
  const handleCameraStream = (images: any) => {
    const loop = async () => {
      const nextImageTensor = images.next().value;
      if (!nextImageTensor) return;

      try {
        // 손 감지
        const hand = await signLanguageService.detectHands(nextImageTensor);
        if (hand) {
          // 손이 감지되면 예측 수행
          const prediction = await signLanguageService.predictFromHandpose(hand);
          
          if (prediction && prediction.probability > 0.7) {
            const now = Date.now();
            const detectedLetter = prediction.letter;
            
            // 새로운 글자가 감지되면
            if (currentDetectedSign !== detectedLetter) {
              setCurrentDetectedSign(detectedLetter);
              setDetectionStartTime(now);
              letterStartTime.current = now;
            } 
            // 동일한 글자가 계속 감지되면
            else if (letterStartTime.current) {
              const elapsedTime = now - letterStartTime.current;
              
              // 임계값보다 오래 유지되면 글자 추가
              if (elapsedTime > threshold) {
                addLetter(detectedLetter);
                letterStartTime.current = null;
                setDetectionStartTime(null);
                setCurrentDetectedSign(null);
              }
            }
          } else {
            // 예측 확률이 낮으면 감지 초기화
            setCurrentDetectedSign(null);
            setDetectionStartTime(null);
            letterStartTime.current = null;
          }
        } else {
          // 손이 감지되지 않으면 초기화
          setCurrentDetectedSign(null);
          setDetectionStartTime(null);
          letterStartTime.current = null;
        }
      } catch (error) {
        console.error('Error in camera loop:', error);
      } finally {
        tf.dispose(nextImageTensor);
        rafId.current = requestAnimationFrame(loop);
      }
    };

    loop();
  };

  // 난이도 변경 함수
  const toggleThreshold = () => {
    if (threshold === RecognitionThreshold.BEGINNER) {
      setThreshold(RecognitionThreshold.INTERMEDIATE);
    } else if (threshold === RecognitionThreshold.INTERMEDIATE) {
      setThreshold(RecognitionThreshold.ADVANCED);
    } else {
      setThreshold(RecognitionThreshold.BEGINNER);
    }
  };

  // 현재 난이도 표시
  const getThresholdLabel = () => {
    switch (threshold) {
      case RecognitionThreshold.BEGINNER:
        return 'Beginner';
      case RecognitionThreshold.INTERMEDIATE:
        return 'Intermediate';
      case RecognitionThreshold.ADVANCED:
        return 'Advanced';
      default:
        return 'Beginner';
    }
  };

  // 로딩 중 화면
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading TensorFlow models...</Text>
      </View>
    );
  }

  // 권한이 없는 경우
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required.</Text>
      </View>
    );
  }

  // 카메라 오류
  if (cameraState === CameraState.NOT_FOUND) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 현재 인식 중인 글자 표시 */}
      <View style={styles.detectionContainer}>
        <Text style={styles.detectionTitle}>Current Detection:</Text>
        <Text style={styles.detectionText}>
          {currentDetectedSign || '-'}
        </Text>
      </View>
      
      {/* 현재 문장 표시 */}
      <View style={styles.sentenceContainer}>
        <Text style={styles.sentenceText}>{currentSentence || 'Your sentence will appear here'}</Text>
      </View>
      
      {/* 카메라 뷰 */}
      <View style={styles.cameraContainer}>
        {cameraState === CameraState.READY && (
          <TensorCamera
            style={styles.camera}
            type={Camera.Constants.Type.front}
            useCustomShadersToResize={false}
            cameraTextureHeight={textureDims.height}
            cameraTextureWidth={textureDims.width}
            resizeHeight={tensorDims.height}
            resizeWidth={tensorDims.width}
            resizeDepth={3}
            onReady={handleCameraStream}
            autorender={true}
          />
        )}
      </View>
      
      {/* 버튼 컨트롤 영역 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={resetSentence}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.speakButton]} 
          onPress={() => speakText(currentSentence)}
        >
          <Text style={styles.buttonText}>Speak</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.thresholdButton]} 
          onPress={toggleThreshold}
        >
          <Text style={styles.buttonText}>{getThresholdLabel()}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    margin: 16,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  detectionContainer: {
    padding: 12,
    backgroundColor: '#2C2C2E',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detectionTitle: {
    fontSize: 16,
    color: '#EBEBF5',
    marginBottom: 4,
  },
  detectionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sentenceContainer: {
    padding: 16,
    backgroundColor: '#2C2C2E',
    margin: 16,
    borderRadius: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  sentenceText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#2C2C2E',
    margin: 16,
    borderRadius: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  speakButton: {
    backgroundColor: '#007AFF',
  },
  thresholdButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
}); 