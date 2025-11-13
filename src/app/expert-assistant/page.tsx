'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, User, Bot } from 'lucide-react';
import { chat, ChatInput } from '@/ai/flows/chat';

type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
};

export default function ExpertAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'مرحباً! أنا مساعد محمود الذكي. كيف يمكنني مساعدتك اليوم؟',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const history: ChatInput['history'] = messages.slice(1).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text,
      }));

      const aiResponseText = await chat({
        history: history,
        prompt: currentInput,
      });

      const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', text: aiResponseText };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'عذراً، حدث خطأ ما. الرجاء المحاولة مرة أخرى.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">
          Mahmoud.AI مساعد الخبراء
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-md rounded-lg p-3 text-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p>{message.text}</p>
              </div>
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8">
                   <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-md rounded-lg p-3 text-sm bg-muted">
                <p>يفكر...</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t p-4">
        <div className="relative">
          <Input
            placeholder="اكتب رسالتك هنا..."
            className="pr-28 pl-4"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
