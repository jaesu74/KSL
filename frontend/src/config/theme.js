// MZ세대 취향의 색상 팔레트 및 UI 테마
const colors = {
  primary: '#7E57C2',       // 퍼플: 트렌디하고 현대적인 느낌
  secondary: '#00BFA5',     // 틸: 젊고 활기찬 느낌
  accent: '#FF7043',        // 코랄: 생동감 있는 악센트
  background: '#121212',    // 다크 모드 기본
  backgroundLight: '#1E1E1E', // 다크 모드 카드 배경
  text: '#FFFFFF',          // 기본 텍스트 색상
  textSecondary: '#B0B0B0', // 부제목 텍스트 색상
  border: '#2C2C2C',        // 경계선 색상
  success: '#4CAF50',       // 성공 상태
  error: '#F44336',         // 오류 상태
  warning: '#FFCA28',       // 경고 상태
  gradient: {               // 그라데이션 설정
    primary: ['#7E57C2', '#673AB7'],
    secondary: ['#00BFA5', '#009688'],
    background: ['#121212', '#212121'],
    vibrant: ['#7E57C2', '#00BFA5', '#FF7043'], // MZ세대 감성의 다중 그라데이션
  }
};

// 폰트 설정
const fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  bold: 'Pretendard-Bold',
  sizes: {
    xs: 12,
    small: 14,
    medium: 16,
    large: 18,
    xl: 22,
    xxl: 28,
  }
};

// 공통 스타일 
const styles = {
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  button: {
    primary: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    text: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: fonts.sizes.medium,
      textAlign: 'center',
    }
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: fonts.sizes.medium,
  }
};

export default {
  colors,
  fonts,
  styles
}; 