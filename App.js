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
  ActivityIndicator,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import axios from 'axios';

export default function App() {
  // الحالات
  const [text, setText] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'مرحباً! أنا مساعد الطبخ. كيف يمكنني مساعدتك؟', from: 'bot' },
  ]);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('غير متصل');

  // تهيئة Voice
  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    checkServer();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // فحص السيرفر
  const checkServer = async () => {
    try {
      setServerStatus('جاري الاتصال...');
      // هنا ضع IP سيرفرك
      const response = await axios.get('http://YOUR_SERVER_IP:8080/health');
      if (response.status === 200) {
        setServerStatus('✅ متصل');
      }
    } catch (error) {
      setServerStatus('❌ غير متصل');
      console.log('السيرفر غير متاح. يمكنك استخدام النسخة المحلية.');
    }
  };

  // معالجات Voice
  const onSpeechStart = () => {
    setIsListening(true);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechResults = (e) => {
    const text = e.value[0];
    setRecognizedText(text);
    setText(text);
    sendToServer(text);
  };

  const onSpeechError = (e) => {
    console.log(e);
    setIsListening(false);
    Alert.alert('خطأ', 'تعذر التعرف على الصوت');
  };

  // بدء الاستماع
  const startListening = async () => {
    try {
      await Voice.start('ar-SA');
      setRecognizedText('🎤 أتكلم الآن...');
    } catch (e) {
      console.log(e);
    }
  };

  // إيقاف الاستماع
  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.log(e);
    }
  };

  // إرسال للسيرفر
  const sendToServer = async (userText) => {
    if (!userText.trim()) return;

    // أضف رسالة المستخدم
    const userMessage = { id: Date.now(), text: userText, from: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      let response;
      
      if (serverStatus === '✅ متصل') {
        // إرسال للسيرفر
        response = await axios.post('http://YOUR_SERVER_IP:8080/api/chat', {
          message: userText,
          userId: 'user123'
        });
      } else {
        // استخدام ردود محلية إذا السيرفر غير متصل
        response = { data: { reply: getLocalResponse(userText) } };
      }

      const botReply = response.data.reply;
      
      // أضف رد البوت
      const botMessage = { id: Date.now() + 1, text: botReply, from: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      
      // تكلم بالرد
      speakText(botReply);
      
    } catch (error) {
      console.log('خطأ:', error);
      const errorMessage = { 
        id: Date.now() + 1, 
        text: 'عذراً، حدث خطأ. جرب مرة أخرى.', 
        from: 'bot' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // ردود محلية
  const getLocalResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('كبسة') || lowerQuery.includes('كبسه')) {
      return `لعمل كبسة دجاج:
1. انقع 3 أكواب أرز
2. اغسل الدجاج
3. اطبخ البصل حتى يذبل
4. أضف الدجاج والبهارات
5. أضف الماء واتركه يغلي
6. أضف الأرز واطبخ على نار هادئة 30 دقيقة`;
    }
    
    if (lowerQuery.includes('سلطة')) {
      return `سلطة سهلة:
- خس
- طماطم
- خيار
- زيت زيتون
- ليمون
- ملح
قطّع الخضار واخلطها مع التتبيلة`;
    }
    
    if (lowerQuery.includes('مرحبا') || lowerQuery.includes('اهلا')) {
      return 'مرحباً بك! أنا مساعد الطبخ. اسألني عن أي وصفة.';
    }
    
    return 'أنا مساعد الطبخ. اسألني عن وصفات مثل: كبسة دجاج، سلطة، معكرونة، وغيرها.';
  };

  // تحويل النص إلى كلام
  const speakText = (textToSpeak) => {
    if (textToSpeak.trim()) {
      setIsSpeaking(true);
      Speech.speak(textToSpeak, {
        language: 'ar',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  // إيقاف الكلام
  const stopSpeech = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  // إرسال نص يدوي
  const handleSend = () => {
    if (text.trim()) {
      sendToServer(text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍳 مساعد الطبخ الذكي</Text>
        <View style={styles.serverStatus}>
          <Text style={styles.statusText}>السيرفر: {serverStatus}</Text>
          <TouchableOpacity onPress={checkServer} style={styles.refreshButton}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* منطقة المحادثة */}
      <ScrollView style={styles.chatContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.from === 'user' ? styles.userMessage : styles.botMessage
            ]}>
            <Text style={[
              styles.messageText,
              message.from === 'user' ? styles.userMessageText : styles.botMessageText
            ]}>
              {message.text}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#4a6fa5" />
            <Text style={styles.loadingText}>جاري البحث عن وصفة...</Text>
          </View>
        )}
      </ScrollView>

      {/* منطقة التحكم الصوتي */}
      <View style={styles.voiceControl}>
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.listeningButton]}
          onPress={isListening ? stopListening : startListening}>
          <Text style={styles.voiceButtonText}>
            {isListening ? '🎤 يتحدث...' : '🎤 اضغط للتحدث'}
          </Text>
          <Text style={styles.voiceHint}>قل: "كيف أعمل كبسة دجاج؟"</Text>
        </TouchableOpacity>

        {isSpeaking && (
          <TouchableOpacity style={styles.stopButton} onPress={stopSpeech}>
            <Text style={styles.stopButtonText}>⏹ إيقاف الصوت</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* منطقة الإدخال النصي */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="أو اكتب سؤالك هنا..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* النص المتفاعل عليه */}
      {recognizedText && (
        <View style={styles.recognizedContainer}>
          <Text style={styles.recognizedTitle}>تعرفت على:</Text>
          <Text style={styles.recognizedText}>{recognizedText}</Text>
        </View>
      )}

      {/* أمثلة سريعة */}
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>أمثلة للطلب:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['كيف أعمل كبسة؟', 'وصفة سلطة', 'طريقة عمل معكرونة', 'حلويات سهلة'].map((example, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.exampleButton}
              onPress={() => sendToServer(example)}>
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* تذييل */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isListening ? '🎤 يتحدث...' : 'جاهز للاستماع'}
          {isSpeaking && ' | 🔊 يتحدث'}
        </Text>
        <Text style={styles.footerNote}>STT/TTS محلي • Gemini API • Go Backend</Text>
      </View>
    </View>
  );
}

// الأنماط
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#4a6fa5',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  serverStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshButton: {
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 18,
  },
  chatContainer: {
    flex: 1,
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a6fa5',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#333',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  voiceControl: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 25,
    elevation: 3,
  },
  voiceButton: {
    backgroundColor: '#4a6fa5',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
  },
  listeningButton: {
    backgroundColor: '#f72585',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  voiceHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  stopButton: {
    marginTop: 10,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  stopButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    elevation: 2,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#4a6fa5',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recognizedContainer: {
    backgroundColor: '#e9f5ff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  recognizedTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recognizedText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  examplesContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  examplesTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  exampleButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 1,
  },
  exampleText: {
    color: '#4a6fa5',
    fontSize: 14,
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginBottom: 5,
  },
  footerNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: 10,
  },
});
