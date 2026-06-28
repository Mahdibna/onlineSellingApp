import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from 'config/colors';
const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! I am the virtual assistant of Shandong Xinxu Group. How can I assist you today?", isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const API_URL = 'http://192.168.147.1:5000/chat'; // Flask endpoint
  const INIT_URL = 'http://192.168.147.1:5000/init'; // Initialization endpoint

  // Initialize backend with token
  const initializeBackend = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('No token found for initialization');
        return;
      }

      console.log(`Sending initialization request to ${INIT_URL}`);
      const response = await fetch(INIT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`Initialization successful: ${JSON.stringify(data)}`);
      } else {
        console.error(`Initialization failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  };

  // Run initialization on component mount
  useEffect(() => {
    initializeBackend();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const newMessage = { id: Date.now().toString(), text: inputText.trim(), isUser: true };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputText('');

    // Show typing indicator
    setIsTyping(true);

    console.log(`Sending request to ${API_URL}`);

    try {
      // Retrieve token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please sign in.');
      }

      const startTime = Date.now();
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: inputText.trim(),
          token: token
        }),
      });

      console.log(`Response received in ${Date.now() - startTime}ms`);
      console.log(`Response status: ${response.status}`);

      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }

      const responseText = await response.text();
      console.log(`Raw response: ${responseText}`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format');
      }

      if (data && data.response) {
        const botMessage = { id: Date.now().toString(), text: data.response, isUser: false };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {
        throw new Error('Response missing expected format');
      }

    } catch (error) {
      console.error('Error details:', error);
      let errorText = 'A communication error occurred. Please try again.';
      if (error.message.includes('Authentication failed')) {
        errorText = 'Please sign in to continue. Redirecting to login...';
        Alert.alert('Authentication Error', errorText, [
          {
            text: 'OK',
            onPress: () => {
              // TODO: Redirect to login screen
              console.log('Redirect to login');
            }
          }
        ]);
      } else if (error.message.includes('Invalid response format')) {
        errorText = 'The server returned an invalid response. Please contact support.';
      }
      const errorMessage = {
        id: Date.now().toString(),
        text: errorText,
        isUser: false
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>
          <Icon name="robot" size={20} color="white" /> Shandong Xinxu Group Virtual Assistant
        </Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.chatArea}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
      />
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Icon name="circle-notch" size={16} color="#666" />
          <Text style={styles.typingText}>Response in progress...</Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="paper-plane" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  header: {
    backgroundColor:colors.lightGray,
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chatArea: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: '#FFE4B5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botMessage: {
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 15,
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default ChatbotScreen;