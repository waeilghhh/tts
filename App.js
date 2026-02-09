import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export default function App() {
  // الحالات
  const [textToSpeak, setTextToSpeak] = useState('مرحباً! هذا اختبار للصوت');
  const [recognizedText, setRecognizedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  // طلب صلاحيات عند البدء
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await requestPermission();
      }
    })();
  }, []);

  // دالة تحويل النص إلى كلام (TTS)
  const speakText = () => {
    if (textToSpeak.trim() === '') {
      Alert.alert('تنبيه', 'الرجاء إدخال نص للتحدث');
      return;
    }
    
    const options = {
      language: 'ar', // العربية
      pitch: 1.0,     // درجة الصوت
      rate: 0.8,      // السرعة
    };
    
    Speech.speak(textToSpeak, options);
  };

  // بدء التسجيل للتعرف على الكلام
  const startRecording = async () => {
    try {
      if (permissionResponse.status !== 'granted') {
        Alert.alert('صلاحيات الميكروفون', 'الرجاء منح صلاحيات الميكروفون');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecognizedText('🎤 أتكلم الآن...');
      
      Alert.alert('التسجيل', 'ابدأ بالتكلم الآن', [{ text: 'حسناً' }]);
    } catch (err) {
      console.error('خطأ في التسجيل:', err);
      Alert.alert('خطأ', 'تعذر بدء التسجيل');
    }
  };

  // إيقاف التسجيل ومعالجة الصوت
  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // هنا سيكون STT الحقيقي
      // لكن في هذا المثال سنستخدم نص تجريبي
      simulateSTT(uri);
      
      setRecording(null);
    } catch (error) {
      console.error('خطأ في إيقاف التسجيل:', error);
    }
  };

  // محاكاة STT (للتجربة)
  const simulateSTT = (audioUri) => {
    const phrases = [
      "مرحباً كيف حالك",
      "أنا جيد شكراً لك",
      "اليوم يوم جميل",
      "أحب برمجة التطبيقات",
      "هذا اختبار للتعرف على الصوت",
      "كيف يمكنني مساعدتك",
      "شكراً على استخدام التطبيق"
    ];
    
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setRecognizedText(randomPhrase);
    
    Alert.alert('تم التعرف على الصوت', `النص: ${randomPhrase}`);
  };

  // إيقاف كل الكلام
  const stopAllSpeech = () => {
    Speech.stop();
  };

  // أمثلة نصية جاهزة
  const exampleTexts = [
    'مرحباً بك في التطبيق',
    'كيف يمكنني مساعدتك اليوم؟',
    'أنا مساعدك الذكي للطبخ',
    'هذا اختبار لنظام التحويل الصوتي',
    'شكراً لك على استخدام التطبيق'
  ];

  return (
    <ScrollView style={styles.container}>
      {/* العنوان */}
      <View style={styles.header}>
        <Text style={styles.title}>🎤 اختبار STT / TTS</Text>
        <Text style={styles.subtitle}>محلي على Android</Text>
      </View>

      {/* قسم TTS (نص إلى كلام) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📢 تحويل النص إلى كلام</Text>
        
        <TextInput
          style={styles.input}
          value={textToSpeak}
          onChangeText={setTextToSpeak}
          placeholder="اكتب نصاً لتحويله إلى صوت..."
          multiline
          numberOfLines={3}
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={speakText}>
          <Text style={styles.buttonText}>▶ تشغيل النص صوتياً</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={stopAllSpeech}>
          <Text style={styles.buttonText}>⏹ إيقاف الصوت</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>أمثلة سريعة:</Text>
        <View style={styles.examplesContainer}>
          {exampleTexts.map((text, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleButton}
              onPress={() => {
                setTextToSpeak(text);
                setTimeout(() => speakText(), 100);
              }}>
              <Text style={styles.exampleText}>{text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* قسم STT (كلام إلى نص) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎙️ تحويل الكلام إلى نص</Text>
        
        <Text style={styles.recordingStatus}>
          {isRecording ? '🔴 تسجيل... تكلم الآن' : '⚫ جاهز للتسجيل'}
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recording]}
            onPress={isRecording ? stopRecording : startRecording}>
            <Text style={styles.recordButtonText}>
              {isRecording ? '⏹ إيقاف التسجيل' : '🎤 بدء التسجيل'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.resultTitle}>النص المُتعرف عليه:</Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{recognizedText || 'سوف يظهر النص هنا...'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.speakResultButton}
          onPress={() => recognizedText && Speech.speak(recognizedText, { language: 'ar' })}>
          <Text style={styles.buttonText}>🔊 نطق النص المُتعرف عليه</Text>
        </TouchableOpacity>
      </View>

      {/* معلومات */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ معلومات:</Text>
        <Text style={styles.infoText}>
          • TTS: تحويل النص إلى صوت (يعمل فعلياً){'\n'}
          • STT: محاكاة للتجربة (يحتاج إضافة مكتبة){'\n'}
          • للتجربة الحقيقية أضف: @react-native-voice/voice
        </Text>
        
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => {
            Speech.speak('هذا اختبار لنظام الصوت', { language: 'ar' });
          }}>
          <Text style={styles.testButtonText}>🎵 اختبار سريع</Text>
        </TouchableOpacity>
      </View>

      {/* حالة الصلاحيات */}
      <View style={styles.permissionCard}>
        <Text style={styles.permissionText}>
          حالة صلاحيات الميكروفون:{' '}
          <Text style={styles.permissionStatus}>
            {permissionResponse?.granted ? '✅ مُعطاة' : '❌ تحتاج'}
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

// الأنماط
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    paddingTop: 40,
  },
  header: {
    backgroundColor: '#4361ee',
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    textAlignVertical: 'top',
    minHeight: 80,
    backgroundColor: '#f9f9f9',
  },
  primaryButton: {
    backgroundColor: '#4361ee',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#555',
  },
  examplesContainer: {
    marginTop: 10,
  },
  exampleButton: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  exampleText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  recordingStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  recording: {
    backgroundColor: '#f44336',
  },
  recordButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  resultBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 80,
    marginBottom: 15,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  speakResultButton: {
    backgroundColor: '#9c27b0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1565c0',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#00bcd4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  permissionCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  permissionText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  permissionStatus: {
    fontWeight: 'bold',
  },
});
