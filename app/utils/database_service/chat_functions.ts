import { db } from '@/app/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { ChatMessage } from '../gemini_service';

// Collection reference
const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

// Function to create a new chat
export const createNewChat = async (userId: string, title: string = 'New Chat') => {
  try {
    const chatRef = await addDoc(collection(db, CHATS_COLLECTION), {
      userId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      success: true,
      data: {
        id: chatRef.id,
        title,
      }
    };
  } catch (error) {
    console.error('Error creating new chat:', error);
    return {
      success: false,
      error: 'Failed to create a new chat session.'
    };
  }
};

// Function to get all chats for a user
export const getUserChats = async (userId: string) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const chats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: chats
    };
  } catch (error) {
    console.error('Error getting user chats:', error);
    return {
      success: false,
      error: 'Failed to fetch chat history.'
    };
  }
};

// Function to add a message to a chat
export const addMessageToChat = async (
  chatId: string, 
  message: Omit<ChatMessage, 'timestamp'>
) => {
  try {
    const messageData = {
      ...message,
      timestamp: serverTimestamp()
    };
    
    await addDoc(
      collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION), 
      messageData
    );
    
    // Update the chat's updatedAt field
    await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error adding message to chat:', error);
    return {
      success: false,
      error: 'Failed to send message.'
    };
  }
};

// Function to get all messages for a chat
export const getChatMessages = async (chatId: string) => {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp ? (data.timestamp as Timestamp).toMillis() : Date.now()
      } as ChatMessage & { id: string };
    });
    
    return {
      success: true,
      data: messages
    };
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return {
      success: false,
      error: 'Failed to fetch messages.'
    };
  }
}; 