import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '@/app/firebase';
import { getUserProfile } from '@/app/utils/database_service/profile_functions';
import { 
  createNewChat,
  getChatMessages,
  addMessageToChat
} from '@/app/utils/database_service/chat_functions';
import { generateFitnessResponse, ChatMessage } from '@/app/utils/gemini_service';
import ChatMessageComponent from '@/app/components/ChatMessage';

export default function ChatScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Load user profile and create a new chat session
  useEffect(() => {
    const loadUserDataAndCreateChat = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.error('User not logged in');
          router.replace('/(auth)/login');
          return;
        }
        
        // Load user profile
        const profileResult = await getUserProfile(userId);
        if (profileResult.success && profileResult.data) {
          setUserProfile(profileResult.data);
          
          // Create a new chat session
          const chatResult = await createNewChat(userId, 'Fitness Coach Chat');
          if (chatResult.success && chatResult.data) {
            setChatId(chatResult.data.id);
            
            // Add initial AI message
            const initialMessage: Omit<ChatMessage, 'timestamp'> = {
              role: 'model',
              content: `Hello! I'm your SmartFit AI coach. How can I help you with your fitness journey today?`
            };
            
            await addMessageToChat(chatResult.data.id, initialMessage);
            
            // Load messages
            const messagesResult = await getChatMessages(chatResult.data.id);
            if (messagesResult.success && messagesResult.data) {
              setMessages(messagesResult.data as (ChatMessage & { id: string })[]);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserDataAndCreateChat();
  }, []);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || !chatId || !userProfile || isSending) return;
    
    try {
      setIsSending(true);
      Keyboard.dismiss();
      
      // Add user message to state immediately for responsive UI
      const userMessage: ChatMessage & { id: string } = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userInput.trim(),
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      const savedUserInput = userInput.trim();
      setUserInput('');
      
      // Save user message to Firebase
      await addMessageToChat(chatId, {
        role: 'user',
        content: savedUserInput
      });
      
      // Generate AI response - no need to pass chat history
      const response = await generateFitnessResponse(savedUserInput, userProfile, []);
      
      // Add AI response to Firebase
      await addMessageToChat(chatId, {
        role: 'model',
        content: response
      });
      
      // Reload messages from Firebase to get proper IDs
      const updatedMessagesResult = await getChatMessages(chatId);
      if (updatedMessagesResult.success && updatedMessagesResult.data) {
        setMessages(updatedMessagesResult.data as (ChatMessage & { id: string })[]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: 'white' }}>
        <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={28} color="#8A2BE2" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8A2BE2', marginLeft: 12 }}>Fitness Coach</Text>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChatMessageComponent message={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={{ padding: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: 'white' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 4 }}>
            <TextInput
              style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 4, fontSize: 16, color: '#1f2937' }}
              placeholder="Ask me about fitness, nutrition, or health..."
              value={userInput}
              onChangeText={setUserInput}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity 
              onPress={handleSendMessage} 
              disabled={isSending || !userInput.trim()}
              style={{ 
                marginLeft: 8, 
                padding: 8, 
                borderRadius: 20,
                backgroundColor: userInput.trim() ? '#8A2BE2' : '#d1d5db'
              }}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 