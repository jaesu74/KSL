import tensorflowService from './TensorFlowService';
import kslModelService from './KSLModelService';
import aslModelService from './ASLModelService';

export interface SignResult {
  text: string;
  confidence: number;
}

// 지원하는 언어 목록
export type SupportedLanguage = 'korean' | 'english' | 'japanese' | 'chinese';

class SignLanguageService {
  private static instance: SignLanguageService;
  private isReady: boolean = false;
  private currentLanguage: SupportedLanguage = 'korean';
  
  // 언어별 모델 서비스 상태 관리
  private modelStatus: Record<SupportedLanguage, boolean> = {
    korean: false,
    english: false,
    japanese: false,
    chinese: false
  };
  
  // 각 언어별 예시 번역 (개발용)
  private translations: Record<string, Record<SupportedLanguage, string>> = {
    'HELLO': {
      korean: '안녕하세요',
      english: 'Hello',
      japanese: 'こんにちは',
      chinese: '你好'
    },
    'THANK_YOU': {
      korean: '감사합니다',
      english: 'Thank you',
      japanese: 'ありがとう',
      chinese: '谢谢'
    },
    'HELP': {
      korean: '도와주세요',
      english: 'Help',
      japanese: '助けて',
      chinese: '帮助'
    }
  };

  private constructor() {
    // 싱글톤 패턴
  }

  public static getInstance(): SignLanguageService {
    if (!SignLanguageService.instance) {
      SignLanguageService.instance = new SignLanguageService();
    }
    return SignLanguageService.instance;
  }

  /**
   * 서비스 초기화
   */
  public async initialize(): Promise<boolean> {
    try {
      // TensorFlow 서비스 초기화
      await tensorflowService.loadModel();
      
      // 한국어 수화 모델 초기화
      const kslReady = await kslModelService.initialize();
      this.modelStatus.korean = kslReady;
      
      // 영어 수화(ASL) 모델 초기화
      const aslReady = await aslModelService.initialize();
      this.modelStatus.english = aslReady;
      
      // 최소한 한국어 모델이 준비되어야 서비스가 작동
      this.isReady = this.modelStatus.korean;
      
      console.log('수화 인식 서비스 초기화 완료:', this.modelStatus);
      return this.isReady;
    } catch (error) {
      console.error('수화 인식 서비스 초기화 실패:', error);
      this.isReady = false;
      return false;
    }
  }

  /**
   * 비디오 파일에서 수화를 인식
   * @param videoPath 비디오 파일 경로
   */
  public async recognizeFromVideo(videoPath: string): Promise<SignResult> {
    if (!this.isReady) {
      console.warn('수화 인식 서비스가 초기화되지 않았습니다.');
    }

    try {
      // 현재 선택된 언어에 따라 적절한 모델 사용
      switch (this.currentLanguage) {
        case 'korean':
          return await kslModelService.recognizeFromVideo(videoPath);
          
        case 'english':
          if (this.modelStatus.english) {
            return await aslModelService.recognizeFromVideo(videoPath);
          }
          break;
          
        // 다른 언어는 아직 구현되지 않음
        case 'japanese':
        case 'chinese':
        default:
          break;
      }
      
      // 해당 언어 모델이 없거나 준비되지 않은 경우 더미 데이터 반환
      console.warn(`${this.currentLanguage} 언어의 수화 모델이 준비되지 않았습니다. 더미 데이터를 사용합니다.`);
      
      // 가상의 딜레이 (1~2초)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // 더미 텍스트 생성
      const dummyTexts = [
        '안녕하세요', '감사합니다', '도와주세요', '네', '아니오',
        '좋아요', '나빠요', '부탁해요', '배고파요', '물'
      ];
      
      const randomText = dummyTexts[Math.floor(Math.random() * dummyTexts.length)];
      
      return {
        text: `[${this.currentLanguage}] ${randomText} (준비 중)`,
        confidence: 0.5
      };
    } catch (error) {
      console.error('수화 인식 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 인식 언어 설정
   * @param language 언어 코드
   */
  public setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
    console.log(`수화 인식 언어 변경: ${language} (지원 상태: ${this.modelStatus[language]})`);
  }

  /**
   * 현재 설정된 언어 반환
   */
  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * 언어별 모델 상태 확인
   */
  public getLanguageStatus(): Record<SupportedLanguage, boolean> {
    return { ...this.modelStatus };
  }

  /**
   * 서비스 준비 상태 확인
   */
  public isInitialized(): boolean {
    return this.isReady;
  }

  /**
   * 리소스 해제
   */
  public dispose(): void {
    kslModelService.dispose();
    aslModelService.dispose();
    console.log('모든 수화 인식 모델 리소스 해제 완료');
  }
}

export default SignLanguageService.getInstance(); 