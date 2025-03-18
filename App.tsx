/**
 * 한국 수화 통역사 앱
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import tensorflowService from './src/services/TensorFlowService';
import signLanguageService from './src/services/SignLanguageService';

// 경고 메시지 비활성화 (필요시)
LogBox.ignoreLogs([
  'Warning: ...',
  // TensorFlow.js 관련 경고 무시
  'TensorFlow.js',
  'TF.js',
  // 카메라 관련 경고 무시
  'ViewPropTypes'
]); 

function App(): React.JSX.Element {
  // 앱이 시작될 때 서비스 초기화
  useEffect(() => {
    const initServices = async () => {
      try {
        // 수화 인식 서비스 초기화
        await signLanguageService.initialize();
        console.log('앱 초기화 완료');
      } catch (error) {
        console.error('앱 초기화 중 오류 발생:', error);
      }
    };

    initServices();

    // 앱이 종료될 때 리소스 해제
    return () => {
      // 모든 리소스 해제
      signLanguageService.dispose();
      tensorflowService.dispose();
      console.log('앱 종료: 모든 리소스 해제');
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <AppNavigator />
    </>
  );
}

export default App;
