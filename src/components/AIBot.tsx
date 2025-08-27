import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  User
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const AIBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm CyberSecure AI, your cybersecurity assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  const API_BASE_URL = 'http://localhost:5001/api';

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      if (session) {
        // This block makes the REAL API call to your backend
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // The session object from Supabase/useAuth contains the access_token
            'Authorization': `Bearer ${session.access_token}`,
          },
          // The backend expects an object with a 'message' key
          body: JSON.stringify({ message: messageContent }),
        });

        if (!response.ok) {
          // Try to parse the JSON error response from the backend
          const errorData = await response.json().catch(() => {
            // Fallback if the response isn't valid JSON
            return { error: 'The server returned an invalid error response.' };
          });
          // Throw an error to be caught by the catch block
          throw new Error(errorData.error || 'The API request failed.');
        }

        const data = await response.json();

        // Create the bot's response message from the API data
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          // Your server.js sends the response in a 'response' key
          content: data.response,
          sender: 'bot',
          timestamp: new Date()
        };

        // Add the bot's message to the chat
        setMessages(prev => [...prev, botMessage]);

      } else {
        // THIS IS THE BLOCK THAT IS CURRENTLY RUNNING
        // It calls your hardcoded JavaScript function because 'session' is null or undefined.
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(messageContent), // Fallback to demo response
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('threat') || lowerInput.includes('attack')) {
      return "I understand you're concerned about security threats. Can you provide more details about the specific threat you've encountered? I can help you assess the situation and recommend appropriate security measures.";
    }

    if (lowerInput.includes('phishing') || lowerInput.includes('email')) {
      return "Phishing attacks are serious security concerns. If you've received a suspicious email, please don't click any links or download attachments. You can report it through our 'Report Suspicious' tab in the dashboard.";
    }

    if (lowerInput.includes('password') || lowerInput.includes('login')) {
      return "Password security is crucial. I recommend using strong, unique passwords for each account, enabling two-factor authentication, and regularly updating your passwords. Need help with specific password security practices?";
    }

    if (lowerInput.includes('malware') || lowerInput.includes('virus')) {
      return "Malware detection is important for system security. Keep your antivirus software updated, avoid suspicious downloads, and run regular system scans. If you suspect malware, consider disconnecting from the internet and running a full system scan.";
    }

    return "I'm here to help with cybersecurity questions and concerns. You can ask me about threats, security best practices, how to report incidents, or any other security-related topics. What specific area would you like assistance with?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg animate-pulse-glow hover:scale-110 transition-transform"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`${isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        } shadow-2xl border-2 border-primary/20 transition-all duration-300`}>
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-sm">CyberSecure AI</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[440px]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={
                          message.sender === 'bot'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }>
                          {message.sender === 'bot' ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 text-sm ${message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                          }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about cybersecurity..."
                  className="resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};