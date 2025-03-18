import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices, CameraPermissionStatus } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import signLanguageService from '../services/SignLanguageService';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back; // 타입 문제가 있지만 라이브러리 버전에 따라 동작함
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();
      setHasPermission(
        cameraPermission === 'authorized' && microphonePermission === 'authorized'
      );
      
      // 수화 인식 서비스 초기화
      await signLanguageService.initialize();
    })();
  }, []);

  const startRecording = async () => {
    try {
      if (cameraRef.current) {
        setIsRecording(true);
        setRecognizedText('');
        setConfidenceScore(0);
        
        cameraRef.current.startRecording({
          onRecordingFinished: (video) => {
            console.log('Video recorded:', video);
            // 여기서 AI 모델에 영상을 전송하여 수화 인식 처리
            processSignLanguage(video.path);
          },
          onRecordingError: (error) => {
            console.error('Recording error:', error);
            Alert.alert('오류', '녹화 중 오류가 발생했습니다.');
            setIsRecording(false);
            setIsProcessing(false);
          },
        });
      }
    } catch (e) {
      console.error('Failed to start recording:', e);
      Alert.alert('오류', '녹화를 시작할 수 없습니다.');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (cameraRef.current) {
        await cameraRef.current.stopRecording();
        setIsRecording(false);
        setIsProcessing(true);
      }
    } catch (e) {
      console.error('Failed to stop recording:', e);
      setIsProcessing(false);
    }
  };

  const processSignLanguage = async (videoPath: string) => {
    // 수화 인식 서비스를 사용하여 수화를 인식하고 텍스트로 변환
    try {
      setIsProcessing(true);
      const result = await signLanguageService.recognizeFromVideo(videoPath);
      setRecognizedText(result.text);
      setConfidenceScore(result.confidence);
      setIsProcessing(false);
    } catch (error) {
      console.error('수화 인식 중 오류:', error);
      Alert.alert('오류', '수화 인식 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>카메라 권한 요청 중...</Text></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text>카메라 접근 권한이 없습니다.</Text></View>;
  }

  if (device == null) {
    return <View style={styles.container}><Text>카메라를 불러오는 중...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />
      )}
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.button, isRecording ? styles.recordingButton : null, isProcessing ? styles.disabledButton : null]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>{isRecording ? '중지' : '녹화'}</Text>
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>수화 인식 중...</Text>
        </View>
      )}

      {recognizedText ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>인식된 결과:</Text>
          <Text style={styles.resultText}>{recognizedText}</Text>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              신뢰도: {Math.round(confidenceScore * 100)}%
            </Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { width: `${confidenceScore * 100}%` },
                  confidenceScore > 0.8 ? styles.highConfidence : 
                  confidenceScore > 0.6 ? styles.mediumConfidence : styles.lowConfidence
                ]} 
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#9e9e9e',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  resultTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  confidenceContainer: {
    marginTop: 5,
  },
  confidenceText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  highConfidence: {
    backgroundColor: '#4CAF50',
  },
  mediumConfidence: {
    backgroundColor: '#FFC107',
  },
  lowConfidence: {
    backgroundColor: '#F44336',
  },
});

export default CameraScreen; 