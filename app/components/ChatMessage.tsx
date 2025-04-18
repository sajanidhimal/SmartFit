import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage as ChatMessageType } from '../utils/gemini_service';

interface ChatMessageProps {
  message: ChatMessageType & { id?: string };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
        {formattedTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  aiContainer: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
  },
  userBubble: {
    backgroundColor: '#8A2BE2',
  },
  aiBubble: {
    backgroundColor: '#e5e7eb',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 4,
    marginRight: 4,
  },
  userTimestamp: {
    color: '#9ca3af',
    alignSelf: 'flex-end',
  },
  aiTimestamp: {
    color: '#9ca3af',
    alignSelf: 'flex-start',
  },
});

export default ChatMessage; 