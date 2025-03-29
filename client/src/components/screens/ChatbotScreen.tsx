import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, Send, Bot, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ChatbotScreenProps {
  handleBack: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatbotScreen({ handleBack }: ChatbotScreenProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm A1, your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the backend API to get AI response
      // Convert 'assistant' role to 'model' for Gemini compatibility
      const response = await apiRequest("POST", "/api/chat", {
        message: input,
        history: messages.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          content: msg.content,
        })),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to get response from AI");
      }

      const aiResponse: Message = {
        id: Date.now().toString() + "-ai",
        role: "assistant",
        content: data.response || "I'm not sure how to respond to that.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });

      // Add a fallback message in case of error
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button className="mr-3" onClick={handleBack}>
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">A1 Assistant</h1>
        </div>

        {/* Model selector dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4 mr-2 text-pink-500" />
              <span className="mr-1">A1 Model Beta</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem className="flex items-center cursor-default bg-gray-50">
              <Sparkles className="h-4 w-4 mr-2 text-pink-500" />
              <span>A1 Model Beta</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="flex items-center text-gray-400">
              <Bot className="h-4 w-4 mr-2" />
              <span>A1 Pro (Coming Soon)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-pink-100" : "text-gray-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <p className="text-sm">A1 is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-opacity-50">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Message A1..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className={`rounded-full w-8 h-8 p-0 ml-2 ${
              input.trim()
                ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                : "bg-gray-200 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}