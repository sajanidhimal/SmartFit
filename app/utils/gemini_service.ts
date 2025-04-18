import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
// Use a temporary API key for testing - this should be properly secured in production
const API_KEY = 'AIzaSyAIARCt9KvOtQZPrWGvmc31FN-yvjrD-Qw'; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Define chat history type
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

// Create a function to generate a fitness-focused response from Gemini
export async function generateFitnessResponse(
  prompt: string, 
  userInfo: any,
  history: ChatMessage[]
): Promise<string> {
  try {
    // Create a model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create a fitness-focused system prompt
    const systemPrompt = `You are SmartFit AI, a professional fitness coach and nutritionist helping users achieve their fitness goals.
    
User's profile:
- Gender: ${userInfo.gender || 'Not specified'}
- Age: ${userInfo.age || 'Not specified'}
- Current weight: ${userInfo.weight || 'Not specified'} kg
- Target weight: ${userInfo.targetWeight || 'Not specified'} kg
- Height: ${userInfo.height || 'Not specified'} cm
- BMI: ${userInfo.bmi || 'Not specified'}
- Activity level: ${userInfo.activityLevel || 'Not specified'}
- Daily calorie goal: ${userInfo.dailyCalorieGoal || 'Not specified'} kcal

Provide personalized, accurate fitness and nutrition advice based on this profile. Focus only on fitness, nutrition, health, and wellness topics. 
If asked about topics unrelated to fitness, nutrition, or wellness, politely redirect the conversation to fitness-related topics. 
Keep responses concise, practical, and actionable.`;

    // Generate response using just the prompt without history
    const result = await model.generateContent([
      systemPrompt,
      `User Query: ${prompt}`
    ]);
    
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    return 'Sorry, I encountered an error while generating a response. Please try again later.';
  }
} 