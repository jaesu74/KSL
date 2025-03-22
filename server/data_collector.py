import os
import cv2
import json
import time
import numpy as np
import mediapipe as mp
import argparse
import tkinter as tk
from tkinter import simpledialog, messagebox
from tkinter import ttk
from PIL import Image, ImageTk
import threading
import queue
import pyautogui
from tqdm import tqdm

# 미디어파이프 초기화
mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands
mp_pose = mp.solutions.pose

class KslDataCollector:
    def __init__(self, dataset_path="data/ksl_dataset.json", capture_seconds=2):
        """한국어 수화 데이터 수집기 초기화"""
        self.dataset_path = dataset_path
        self.capture_seconds = capture_seconds
        self.frame_rate = 30  # 목표 프레임 레이트
        self.sequence_length = int(self.frame_rate * self.capture_seconds)
        
        # 데이터셋 디렉토리 생성
        os.makedirs(os.path.dirname(self.dataset_path), exist_ok=True)
        
        # 기존 데이터셋 로드 또는 새로 생성
        self.dataset = self.load_dataset()
        
        # 미디어파이프 모델 초기화
        self.hands = mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.pose = mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # 카메라 설정
        self.cap = None
        
        # GUI 구성요소
        self.root = None
        self.frame = None
        self.canvas = None
        self.label_info = None
        self.btn_start = None
        self.btn_add_word = None
        self.btn_save = None
        self.combo_words = None
        self.current_word = None
        
        # 쓰레드 간 통신을 위한 큐
        self.frame_queue = queue.Queue(maxsize=10)
        
        # 상태 플래그
        self.is_capturing = False
        self.recording = False
        self.stop_event = threading.Event()
        
        # 미리보기 스케일링
        self.preview_width = 640
        self.preview_height = 480
        
        # 기록중인 프레임 데이터
        self.current_sequence = []
    
    def load_dataset(self):
        """기존 데이터셋을 로드하거나 새로운 데이터셋 생성"""
        if os.path.exists(self.dataset_path):
            try:
                with open(self.dataset_path, 'r', encoding='utf-8') as f:
                    dataset = json.load(f)
                return dataset
            except:
                print(f"데이터셋 파일 {self.dataset_path}를 로드할 수 없습니다. 새로운 데이터셋을 생성합니다.")
        
        # 기본 단어 목록으로 새로운 데이터셋 생성
        default_words = [
            "안녕하세요", "감사합니다", "미안합니다", "이름", 
            "만나서 반갑습니다", "도움이 필요합니다", "예", "아니오", 
            "괜찮습니다", "사랑합니다"
        ]
        
        return {word: [] for word in default_words}
    
    def save_dataset(self):
        """데이터셋을 파일에 저장"""
        try:
            with open(self.dataset_path, 'w', encoding='utf-8') as f:
                json.dump(self.dataset, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"데이터셋 저장 중 오류 발생: {str(e)}")
            return False
    
    def extract_landmarks(self, frame):
        """프레임에서 손과 포즈 랜드마크 추출"""
        # BGR에서 RGB로 변환
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 이미지 처리 성능 향상을 위해 쓰기 금지
        frame_rgb.flags.writeable = False
        
        # 손 랜드마크 추출
        hands_results = self.hands.process(frame_rgb)
        
        # 포즈 랜드마크 추출
        pose_results = self.pose.process(frame_rgb)
        
        # 이미지 쓰기 가능하도록 설정
        frame_rgb.flags.writeable = True
        
        # 랜드마크 정보 초기화
        frame_data = []
        
        # 왼손과 오른손 랜드마크 구분
        left_hand_landmarks = None
        right_hand_landmarks = None
        
        # 손 랜드마크가 감지된 경우
        if hands_results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(hands_results.multi_hand_landmarks):
                # 손 유형 확인
                if idx < len(hands_results.multi_handedness):
                    handedness = hands_results.multi_handedness[idx].classification[0].label
                    if handedness == "Left":
                        left_hand_landmarks = hand_landmarks
                    else:
                        right_hand_landmarks = hand_landmarks
        
        # 왼손 랜드마크 데이터 추가 (21개 x 3차원)
        if left_hand_landmarks:
            for landmark in left_hand_landmarks.landmark:
                frame_data.extend([landmark.x, landmark.y, landmark.z])
        else:
            # 랜드마크가 없는 경우 0으로 패딩
            frame_data.extend([0.0] * 21 * 3)
        
        # 오른손 랜드마크 데이터 추가 (21개 x 3차원)
        if right_hand_landmarks:
            for landmark in right_hand_landmarks.landmark:
                frame_data.extend([landmark.x, landmark.y, landmark.z])
        else:
            # 랜드마크가 없는 경우 0으로 패딩
            frame_data.extend([0.0] * 21 * 3)
        
        # 포즈 랜드마크 데이터 추가 (33개 x 3차원)
        if pose_results.pose_landmarks:
            for landmark in pose_results.pose_landmarks.landmark:
                frame_data.extend([landmark.x, landmark.y, landmark.z])
        else:
            # 랜드마크가 없는 경우 0으로 패딩
            frame_data.extend([0.0] * 33 * 3)
        
        return frame_data, hands_results, pose_results
    
    def draw_landmarks(self, frame, hands_results, pose_results):
        """프레임에 랜드마크를 그리는 함수"""
        # 손 랜드마크 그리기
        if hands_results.multi_hand_landmarks:
            for hand_landmarks in hands_results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2)
                )
        
        # 포즈 랜드마크 그리기
        if pose_results.pose_landmarks:
            mp_drawing.draw_landmarks(
                frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2, circle_radius=1),
                mp_drawing.DrawingSpec(color=(255, 0, 255), thickness=2)
            )
        
        return frame
    
    def capture_thread(self):
        """카메라 캡처 스레드"""
        self.cap = cv2.VideoCapture(0)
        
        # 카메라 설정
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, self.frame_rate)
        
        while not self.stop_event.is_set():
            ret, frame = self.cap.read()
            if not ret:
                break
            
            # 프레임 뒤집기 (거울 효과)
            frame = cv2.flip(frame, 1)
            
            # 프레임 랜드마크 추출
            if self.recording:
                frame_data, hands_results, pose_results = self.extract_landmarks(frame)
                
                # 현재 시퀀스에 추가
                self.current_sequence.append(frame_data)
                
                # 랜드마크 그리기
                frame = self.draw_landmarks(frame, hands_results, pose_results)
                
                # 녹화 중 표시
                cv2.putText(frame, f"Recording: {len(self.current_sequence)}/{self.sequence_length}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # UI 스레드에 프레임 전달
            try:
                if not self.frame_queue.full():
                    self.frame_queue.put(frame, block=False)
            except:
                pass
            
            # 목표 프레임 레이트 유지
            time.sleep(max(0, 1.0/self.frame_rate - 0.01))
        
        # 카메라 해제
        if self.cap is not None:
            self.cap.release()
    
    def update_preview(self):
        """미리보기 업데이트 함수"""
        if self.stop_event.is_set():
            return
        
        try:
            if not self.frame_queue.empty():
                frame = self.frame_queue.get(block=False)
                
                # OpenCV BGR에서 RGB로 변환
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # PIL 이미지로 변환
                img = Image.fromarray(frame_rgb)
                img = img.resize((self.preview_width, self.preview_height), Image.LANCZOS)
                
                # Tkinter 이미지로 변환
                img_tk = ImageTk.PhotoImage(image=img)
                
                # 캔버스 업데이트
                self.canvas.img_tk = img_tk
                self.canvas.config(width=img.width, height=img.height)
                self.canvas.create_image(0, 0, anchor=tk.NW, image=img_tk)
                
                # 녹화 상태에 따라 버튼 상태 업데이트
                if self.recording:
                    self.btn_start.config(text="녹화 중지", bg="red")
                    self.btn_add_word.config(state=tk.DISABLED)
                    self.combo_words.config(state=tk.DISABLED)
                else:
                    self.btn_start.config(text="녹화 시작", bg="green")
                    self.btn_add_word.config(state=tk.NORMAL)
                    self.combo_words.config(state=tk.NORMAL)
        except:
            pass
        
        # 주기적으로 업데이트
        self.root.after(25, self.update_preview)
    
    def start_recording(self):
        """녹화 시작/중지 토글"""
        if not self.recording:
            # 현재 선택된 단어 확인
            self.current_word = self.combo_words.get()
            if not self.current_word:
                messagebox.showerror("오류", "단어를 선택해주세요.")
                return
            
            # 녹화 시작
            self.recording = True
            self.current_sequence = []
            
            # 3초 카운트다운
            for i in range(3, 0, -1):
                self.label_info.config(text=f"{i}초 후 녹화가 시작됩니다...")
                self.root.update()
                time.sleep(1)
            
            self.label_info.config(text=f"'{self.current_word}' 단어 녹화 중...")
            
            # 배경 스레드에서 녹화 진행
            threading.Thread(target=self.record_sequence, daemon=True).start()
        else:
            # 녹화 중지
            self.recording = False
            self.label_info.config(text="녹화가 중지되었습니다.")
    
    def record_sequence(self):
        """배경에서 시퀀스 녹화 후 완료되면 저장"""
        try:
            start_time = time.time()
            
            # 목표 프레임 수에 도달할 때까지 기다림
            while len(self.current_sequence) < self.sequence_length and self.recording:
                time.sleep(0.01)
                
                # 시간 제한 (5초)
                if time.time() - start_time > 5:
                    break
            
            # 녹화 중지
            self.recording = False
            
            if len(self.current_sequence) > 0:
                # 시퀀스 길이 조정
                if len(self.current_sequence) > self.sequence_length:
                    self.current_sequence = self.current_sequence[:self.sequence_length]
                
                # 데이터셋에 시퀀스 추가
                if self.current_word in self.dataset:
                    self.dataset[self.current_word].append(self.current_sequence)
                else:
                    self.dataset[self.current_word] = [self.current_sequence]
                
                # 임시 저장
                self.save_dataset()
                
                # UI 업데이트
                self.root.after(0, lambda: self.label_info.config(
                    text=f"'{self.current_word}' 단어에 대한 새 샘플이 추가되었습니다. (총 {len(self.dataset[self.current_word])}개)"
                ))
            else:
                self.root.after(0, lambda: self.label_info.config(
                    text="녹화 중 오류가 발생했습니다. 다시 시도하세요."
                ))
        except Exception as e:
            print(f"녹화 중 오류 발생: {str(e)}")
            self.root.after(0, lambda: self.label_info.config(
                text=f"오류 발생: {str(e)}"
            ))
    
    def add_new_word(self):
        """새 단어 추가"""
        new_word = simpledialog.askstring("새 단어", "추가할 한국어 단어를 입력하세요:")
        if new_word and new_word.strip():
            new_word = new_word.strip()
            if new_word not in self.dataset:
                self.dataset[new_word] = []
                self.update_word_list()
                self.combo_words.set(new_word)
                self.label_info.config(text=f"'{new_word}' 단어가 추가되었습니다.")
            else:
                messagebox.showinfo("정보", f"'{new_word}' 단어는 이미 존재합니다.")
    
    def update_word_list(self):
        """단어 목록 업데이트"""
        words = sorted(list(self.dataset.keys()))
        self.combo_words['values'] = words
    
    def show_dataset_info(self):
        """데이터셋 정보 표시"""
        total_samples = sum(len(samples) for samples in self.dataset.values())
        info = f"데이터셋 정보:\n"
        info += f"- 단어 수: {len(self.dataset)}\n"
        info += f"- 총 샘플 수: {total_samples}\n\n"
        
        for word, samples in sorted(self.dataset.items()):
            info += f"- {word}: {len(samples)}개 샘플\n"
        
        messagebox.showinfo("데이터셋 정보", info)
    
    def export_dataset(self):
        """TensorFlow 모델 학습용 데이터셋 내보내기"""
        export_path = self.dataset_path.replace('.json', '_export.json')
        
        with open(export_path, 'w', encoding='utf-8') as f:
            json.dump(self.dataset, f, ensure_ascii=False, indent=2)
        
        messagebox.showinfo("내보내기 완료", f"데이터셋이 {export_path}로 내보내기되었습니다.")
    
    def create_ui(self):
        """사용자 인터페이스 생성"""
        self.root = tk.Tk()
        self.root.title("한국어 수화 데이터 수집기")
        self.root.geometry("800x700")
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # 제목 레이블
        title_label = tk.Label(self.root, text="한국어 수화 데이터 수집기", font=("Helvetica", 16, "bold"))
        title_label.pack(pady=10)
        
        # 단어 선택 프레임
        word_frame = tk.Frame(self.root)
        word_frame.pack(pady=5, fill=tk.X, padx=10)
        
        tk.Label(word_frame, text="단어 선택:").pack(side=tk.LEFT, padx=5)
        
        self.combo_words = ttk.Combobox(word_frame, values=sorted(list(self.dataset.keys())))
        self.combo_words.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        self.btn_add_word = tk.Button(word_frame, text="새 단어 추가", command=self.add_new_word)
        self.btn_add_word.pack(side=tk.LEFT, padx=5)
        
        # 정보 레이블
        self.label_info = tk.Label(self.root, text="단어를 선택하고 '녹화 시작' 버튼을 누르세요.")
        self.label_info.pack(pady=5)
        
        # 미리보기 캔버스
        self.canvas = tk.Canvas(self.root, width=self.preview_width, height=self.preview_height, bg="black")
        self.canvas.pack(padx=10, pady=10)
        
        # 버튼 프레임
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)
        
        self.btn_start = tk.Button(button_frame, text="녹화 시작", bg="green", fg="white", 
                                   font=("Helvetica", 12, "bold"), width=15, height=2, command=self.start_recording)
        self.btn_start.pack(side=tk.LEFT, padx=10)
        
        btn_info = tk.Button(button_frame, text="데이터셋 정보", width=15, height=2, command=self.show_dataset_info)
        btn_info.pack(side=tk.LEFT, padx=10)
        
        btn_export = tk.Button(button_frame, text="데이터셋 내보내기", width=15, height=2, command=self.export_dataset)
        btn_export.pack(side=tk.LEFT, padx=10)
        
        # 도움말 텍스트
        help_text = """
        사용 방법:
        1. 수집할 단어를 선택하거나 새 단어를 추가하세요.
        2. '녹화 시작' 버튼을 클릭하세요. 3초 카운트다운 후 녹화가 시작됩니다.
        3. 카메라 앞에서 해당 단어의 수화 동작을 수행하세요.
        4. 녹화가 자동으로 종료되거나 '녹화 중지' 버튼을 클릭하여 중지할 수 있습니다.
        5. 같은 단어에 대해 여러 번 녹화하여 다양한 샘플을 수집하세요.
        """
        
        help_label = tk.Label(self.root, text=help_text, justify=tk.LEFT, anchor='w')
        help_label.pack(padx=20, pady=10, fill=tk.X)
        
        # 상태 표시줄
        status_frame = tk.Frame(self.root)
        status_frame.pack(side=tk.BOTTOM, fill=tk.X)
        
        status_label = tk.Label(status_frame, text=f"데이터셋 경로: {self.dataset_path}", bd=1, relief=tk.SUNKEN, anchor=tk.W)
        status_label.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # 단어 목록 초기화
        self.update_word_list()
    
    def on_close(self):
        """애플리케이션 종료 처리"""
        if messagebox.askokcancel("종료", "데이터 수집기를 종료하시겠습니까?"):
            # 저장
            self.save_dataset()
            
            # 스레드 중지
            self.stop_event.set()
            
            # 창 닫기
            self.root.destroy()
    
    def run(self):
        """데이터 수집기 실행"""
        # UI 생성
        self.create_ui()
        
        # 캡처 스레드 시작
        threading.Thread(target=self.capture_thread, daemon=True).start()
        
        # 미리보기 업데이트 시작
        self.update_preview()
        
        # Tkinter 메인 루프
        self.root.mainloop()

def main():
    parser = argparse.ArgumentParser(description='한국어 수화 데이터 수집기')
    parser.add_argument('--output', type=str, default='data/ksl_dataset.json',
                        help='데이터셋 저장 경로 (기본값: data/ksl_dataset.json)')
    parser.add_argument('--seconds', type=int, default=2,
                        help='각 샘플 녹화 시간(초) (기본값: 2)')
    args = parser.parse_args()
    
    # 데이터 수집기 실행
    collector = KslDataCollector(dataset_path=args.output, capture_seconds=args.seconds)
    collector.run()

if __name__ == '__main__':
    main() 