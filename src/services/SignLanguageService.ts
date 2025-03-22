import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Camera } from 'expo-camera';
import * as Handpose from '@tensorflow-models/handpose';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

// 수화 모델 타입 정의
export enum SignLanguageModelType {
  ASL = 'asl',
  KSL = 'ksl',
}

// 알파벳 라벨 정의 (A부터 Y까지)
const ASL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'];

// 한글 자음 라벨 (ㄱ부터 ㅎ까지)
const KSL_LABELS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 인식 임계값 정의
export enum RecognitionThreshold {
  BEGINNER = 3000, // 3초
  INTERMEDIATE = 1500, // 1.5초
  ADVANCED = 500, // 0.5초
}

// 카메라 상태 정의
export enum CameraState {
  IDLE = 'IDLE',
  READY = 'READY',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

// 특수 액션 정의
export const DELETE_ACTION = 'DELETE';
export const SPACE_ACTION = 'SPACE';

export class SignLanguageService {
  private aslModel: tf.GraphModel | null = null;
  private kslModel: tf.GraphModel | null = null;
  private handposeModel: Handpose.HandPose | null = null;
  private modelType: SignLanguageModelType = SignLanguageModelType.ASL;
  private tensorCamera: any = null;
  private cameraState: CameraState = CameraState.IDLE;

  constructor() {
    this.initTensorFlow();
  }

  // TensorFlow.js 초기화
  async initTensorFlow() {
    try {
      // TF.js 백엔드 설정
      await tf.ready();
      console.log('TensorFlow.js is ready');
      
      // 모델 로드
      await this.loadHandposeModel();
      await this.loadASLModel();
      
      console.log('TensorFlow models loaded successfully');
    } catch (error) {
      console.error('Error initializing TensorFlow.js:', error);
    }
  }

  // Handpose 모델 로드
  async loadHandposeModel() {
    try {
      this.handposeModel = await Handpose.load();
      console.log('Handpose model loaded');
    } catch (error) {
      console.error('Error loading handpose model:', error);
    }
  }

  // ASL 모델 로드
  async loadASLModel() {
    try {
      const modelPath = require('../../assets/models/asl/model.json');
      this.aslModel = await tf.loadGraphModel(modelPath);
      console.log('ASL model loaded');
    } catch (error) {
      console.error('Error loading ASL model:', error);
    }
  }

  // KSL 모델 로드 (향후 개발 예정)
  async loadKSLModel() {
    try {
      const modelPath = require('../../assets/models/ksl/model.json');
      this.kslModel = await tf.loadGraphModel(modelPath);
      console.log('KSL model loaded');
    } catch (error) {
      console.error('Error loading KSL model:', error);
    }
  }

  // 사용할 모델 타입 설정
  setModelType(type: SignLanguageModelType) {
    this.modelType = type;
  }

  // 현재 사용 중인 모델 타입 반환
  getModelType(): SignLanguageModelType {
    return this.modelType;
  }

  // 라벨 가져오기
  getLabels(): string[] {
    return this.modelType === SignLanguageModelType.ASL ? ASL_LABELS : KSL_LABELS;
  }

  // 손 인식 및 예측
  async predictFromHandpose(hand: any) {
    if (!hand || !hand.landmarks || !this.aslModel) {
      return null;
    }

    try {
      // 손 랜드마크를 1차원 배열로 변환
      const landmarks = hand.landmarks;
      const flattenedLandmarks = landmarks.flat();
      
      // 입력 텐서 생성
      const input = tf.tensor([flattenedLandmarks]);
      
      // 모델 추론
      const model = this.modelType === SignLanguageModelType.ASL ? this.aslModel : this.kslModel;
      if (!model) {
        console.error('No model available for the current type');
        return null;
      }

      const prediction = await model.predict(input);
      
      // 결과 처리
      const predictionData = await prediction.data();
      input.dispose();
      (prediction as tf.Tensor).dispose();
      
      // 최대 확률을 가진 클래스 인덱스 찾기
      const maxProb = Math.max(...predictionData);
      const classIdx = predictionData.indexOf(maxProb);
      
      // 결과 반환
      const labels = this.getLabels();
      if (classIdx >= 0 && classIdx < labels.length) {
        return {
          letter: labels[classIdx],
          probability: maxProb
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error predicting from handpose:', error);
      return null;
    }
  }

  // 카메라에서 손 감지
  async detectHands(tensor: tf.Tensor3D) {
    if (!this.handposeModel) {
      console.warn('Handpose model not loaded');
      return null;
    }

    try {
      const predictions = await this.handposeModel.estimateHands(tensor);
      return predictions.length > 0 ? predictions[0] : null;
    } catch (error) {
      console.error('Error detecting hands:', error);
      return null;
    }
  }

  // TensorCamera 초기화
  initTensorCamera(camera: any) {
    const TensorCamera = cameraWithTensors(Camera);
    this.tensorCamera = TensorCamera;
    return TensorCamera;
  }

  // 리소스 해제
  dispose() {
    if (this.aslModel) {
      this.aslModel.dispose();
      this.aslModel = null;
    }
    
    if (this.kslModel) {
      this.kslModel.dispose();
      this.kslModel = null;
    }
    
    tf.disposeVariables();
  }
}

// 서비스 인스턴스 생성
export const signLanguageService = new SignLanguageService(); 