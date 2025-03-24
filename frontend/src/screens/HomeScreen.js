import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>수어 하자</Text>
          <Text style={styles.subtitle}>한국어 수어 번역 앱</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/images/main-image.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('번역하기')}
          >
            <View style={styles.cardIcon}>
              <Icon name="language-outline" size={30} color="#4A90E2" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>수어 번역하기</Text>
              <Text style={styles.cardDescription}>
                카메라를 이용하여 수화를 텍스트로 번역합니다.
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#A0A0A0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              // 기능 업데이트 예정
              alert('준비 중인 기능입니다.');
            }}
          >
            <View style={styles.cardIcon}>
              <Icon name="book-outline" size={30} color="#4A90E2" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>수어 학습하기</Text>
              <Text style={styles.cardDescription}>
                다양한 수어 표현을 배울 수 있습니다.
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#A0A0A0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('About')}
          >
            <View style={styles.cardIcon}>
              <Icon name="information-circle-outline" size={30} color="#4A90E2" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>앱 정보</Text>
              <Text style={styles.cardDescription}>
                앱 사용법 및 개발자 정보를 확인하세요.
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  image: {
    width: '100%',
    height: 200,
  },
  cardsContainer: {
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    backgroundColor: '#F0F7FF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default HomeScreen; 