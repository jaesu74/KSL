import os
import numpy as np
import pandas as pd
from PIL import Image
import cv2


def zero_padding_4d(img_seq, max_len):
    """
    이미지 시퀸스들 앞에 0으로 된 이미지들 padding
    텐서플로 모델에 넣기 위해서는 이미지 시퀸스의 길이를 모두 맞춰야 하므로
    :param max_len: 이미지 시퀸스의 최종 길이
    """
    img_seq = img_seq.copy()
    # 각 이미지 한 장의 크기
    img_shape = img_seq.shape[1:]
    # zero-padding으로 만들어야하는 이미지 개수
    img_augment_len = max_len - img_seq.shape[0]
    assert img_augment_len >=0, "max_len should longer than image sequence"
    if img_augment_len == 0:
        # 이미지를 늘릴 필요가 없으면 그대로 반환
        return img_seq
    # 해당하는 이미지의 크기를 가진 0 배열 생성
    img_zero = np.zeros((img_augment_len, *img_shape))
    img_seq = np.concatenate([img_zero, img_seq], axis = 0)
    return img_seq


def read_ai(xlen=120, ylen=67, data_path=None, annotation_path=None):
    """
    :param xlen, ylen: 이미지를 원하는 크기로 읽어들이는 것
    :param data_path: 데이터 폴더 경로
    :param annotation_path: 어노테이션 파일 경로
    :returns input, output data(리스트 타입) / max_len 이미지 시퀸스의 길이
    """
    # 데이터 경로 설정 - 기본값은 models 디렉토리의 상위 디렉토리에 data 폴더
    if data_path is None:
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sign_data")
    
    # 어노테이션 파일 경로 설정
    if annotation_path is None:
        annotation_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "수어_데이터셋_어노테이션.xlsx")
    
    # 데이터 폴더나 어노테이션 파일이 없는 경우 기본 값 반환
    if not os.path.exists(data_path) or not os.path.exists(annotation_path):
        print(f"Warning: 데이터 폴더({data_path}) 또는 어노테이션 파일({annotation_path})이 존재하지 않습니다.")
        print("5개의 기본 단어에 대한 더미 데이터를 생성합니다.")
        # 더미 데이터 생성
        dummy_input = [np.zeros((5, ylen, xlen, 3)) for _ in range(5)]
        dummy_output = ["안녕하세요", "감사합니다", "반갑습니다", "도와주세요", "이해했습니다"]
        return dummy_input, dummy_output, 5
    
    # 각 이미지 시퀀스는 폴더에 저장되어 있음. 각 폴더가 하나의 데이터
    try:
        folder_list = os.listdir(data_path)
        
        dataset_annotation = pd.read_excel(annotation_path)
        dataset_annotation.loc[(dataset_annotation["한국어"].map(type) == int), "타입(단어/문장)"] = "숫자"
        dataset_annotation["folder_name"] = dataset_annotation["파일명"].str[:-4]

        input_data = []
        output_data = []
        # 추후에 zero-padding을 위해 이미지 시퀸스의 가장 긴 길이를 체크 해야함
        img_max_len = 0
        
        for i in range(len(folder_list)):
            img_path = os.path.join(data_path, folder_list[i])
            # 각 폴더에는 해당하는 이미지들이 저장되어 있기 때문에, 폴더에 접근해서 이미지들을 순차적으로 읽어들임
            if not os.path.isdir(img_path):
                continue
                
            img_list = os.listdir(img_path)
            img_list.sort()
            
            # 해당 폴더에 대한 어노테이션이 없는 경우 건너뛰기
            if dataset_annotation[dataset_annotation["folder_name"] == folder_list[i]].empty:
                continue
                
            # 메모리 문제 때문에 해당 수어가 문장 또는 숫자인 경우 제외
            if dataset_annotation[dataset_annotation["folder_name"] == folder_list[i]].iloc[0]["타입(단어/문장)"] == "문장":
                continue
            elif dataset_annotation[dataset_annotation["folder_name"] == folder_list[i]].iloc[0]["타입(단어/문장)"] == "숫자":
                continue

            if len(img_list) > img_max_len:
                # 이미지 시퀸스의 최대 길이를 갱신
                img_max_len = len(img_list)
                
            # 폴더 안에 있는 이미지들을 읽어서 리스트에 저장
            img_seq = []
            for j in range(len(img_list)):
                image_path = os.path.join(img_path, img_list[j])
                try:
                    image = Image.open(image_path)
                    image = np.asarray(image, dtype=np.float32)
                    # 이미지를 함수 호출자가 원하는 크기로 변경
                    image = cv2.resize(image, dsize=(xlen, ylen))
                    # 이미지 시퀸스를 만들기 위해 3차원 배열을 4차원 배열로 변환
                    image = image.reshape(-1, *image.shape)
                    img_seq.append(image)
                except Exception as e:
                    print(f"Warning: 이미지 {image_path} 처리 중 오류 발생: {str(e)}")
                    continue
                    
            if not img_seq:
                continue
                
            # img_seq 안에 있는 이미지를 모두 concatenate해서 하나의 4차원 배열로 만듦
            img_seq = np.concatenate(img_seq)
            input_data.append(img_seq)
            # print("Read {0} Complete".format(i))
            label = dataset_annotation[dataset_annotation["folder_name"] == folder_list[i]].loc[:, "한국어"].values[0]
            if type(label) == int:
                label = str(label)
            # 이미지 시퀸스에 해당하는 한국어 추가
            output_data.append(label)

        if not input_data:
            print("Warning: 처리할 수 있는 데이터가 없습니다. 기본 더미 데이터를 생성합니다.")
            # 더미 데이터 생성
            dummy_input = [np.zeros((5, ylen, xlen, 3)) for _ in range(5)]
            dummy_output = ["안녕하세요", "감사합니다", "반갑습니다", "도와주세요", "이해했습니다"]
            return dummy_input, dummy_output, 5

        for i in range(len(input_data)):
            # input_data를 zero-padding해서 모두 같은 길이로 만들어준다.
            input_data[i] = zero_padding_4d(input_data[i], img_max_len)

        return input_data, output_data, img_max_len
        
    except Exception as e:
        print(f"Error: 데이터 로드 중 오류 발생: {str(e)}")
        # 오류 발생 시 더미 데이터 반환
        dummy_input = [np.zeros((5, ylen, xlen, 3)) for _ in range(5)]
        dummy_output = ["안녕하세요", "감사합니다", "반갑습니다", "도와주세요", "이해했습니다"]
        return dummy_input, dummy_output, 5


def train_test_split(data_X, data_y, category, num=5):
    """
    # 한국어를 균일하게 분배하기 위한 train_test_split 함수
    :param data_X, data_y:
    :param category: 총 카테고리 숫자
    :param num: test set으로 분리할 양
    :return:
    """
    test_idx = []
    for i in range(category):
        # 각 한국어에 해당하는 수어 영상 인덱스 추출
        cat_idx = np.where(data_y == i)[0]
        # 전체 인덱스에서 원하는 만큼의 인덱스 추출
        cat_test = np.random.choice(cat_idx, size=min(num, len(cat_idx)), replace=False)
        test_idx.append(cat_test)
    test_idx = np.concatenate(test_idx)
    # 선택된 인덱스는 테스트 데이터로 / 나머지는 훈련 데이터로 사용
    data_y_test = data_y[test_idx]; print(np.unique(data_y_test).shape[0])
    data_y_train = np.delete(data_y, test_idx); print(np.unique(data_y_train).shape[0])
    data_X_test = data_X[test_idx, ...]; print(data_X_test.shape)
    data_X_train = np.delete(data_X, test_idx, axis=0); print(data_X_train.shape)
    return data_X_train, data_y_train, data_X_test, data_y_test
