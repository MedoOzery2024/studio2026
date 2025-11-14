'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, User, Bot, CornerDownLeft, File as FileIcon, X, Copy } from 'lucide-react';
import { chat, ChatInput } from '@/ai/flows/chat';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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
      text: 'مرحباً! أنا مساعد محمود الذكي. يمكنك الآن رفع الملفات لتحليلها. كيف يمكنني مساعدتك اليوم؟',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
    }
  };
  
  const removeFile = () => {
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((input.trim() === '' && !file) || isLoading) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = input;
    const currentFile = file;
    setInput('');
    setFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';

    setIsLoading(true);

    try {
      const history: ChatInput['history'] = messages.slice(1).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.text,
      }));

      let fileDataUri: string | undefined = undefined;
      if (currentFile) {
        fileDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(currentFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      }

      const aiResponseText = await chat({
        history: history,
        prompt: currentInput,
        fileDataUri: fileDataUri,
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
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'تم النسخ بنجاح!',
      description: 'تم نسخ رد الذكاء الاصطناعي إلى الحافظة.',
    });
  };

  return (
    <div className="flex h-screen flex-col bg-background" dir="rtl">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M15 2H6v20h12z"/><path d="M11 1V8h6z" fill="hsl(var(--primary))"/><path d="M11 1V8h6"/><path d="M7 7h4"/><path d="M7 11h8"/><path d="M7 15h4"/></svg>
              <span className="text-lg font-semibold text-foreground">Mahmoud.AI</span>
            </Link>
            <span className="text-lg text-muted-foreground hidden md:inline">/</span>
            <h1 className="text-lg font-medium text-foreground">
              مساعد الخبراء
            </h1>
        </div>
        <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-4 group ${
                message.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-9 w-9 border-2 border-primary/50">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`relative max-w-xl rounded-lg p-3 text-base leading-relaxed ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.sender === 'ai' && (
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(message.text)}
                   >
                     <Copy className="h-4 w-4" />
                   </Button>
                )}
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
              {message.sender === 'user' && (
                <Avatar className="h-9 w-9 border-2 border-border">
                   <AvatarFallback className='bg-muted/50'>
                    <User className="h-5 w-5"/>
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="h-9 w-9 border-2 border-primary/50">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5"/>
                </AvatarFallback>
              </Avatar>
              <div className="max-w-md rounded-lg p-3 text-base bg-muted flex items-center">
                <div className="dot-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-white/10 p-4 shrink-0 bg-background">
        <div className="relative max-w-3xl mx-auto">
           {file && (
            <div className="absolute bottom-full mb-2 w-full">
                <div className="bg-muted p-2 rounded-md flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 truncate">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeFile}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          )}
          <Input
            placeholder="اكتب رسالتك هنا..."
            className="h-12 pr-28 pl-4 bg-muted/50 border-border focus-visible:ring-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isLoading}
              />
            <Button size="icon" onClick={handleSend} disabled={(!input.trim() && !file) || isLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </footer>
       <style jsx>{`
        .dot-pulse {
          position: relative;
          left: -9999px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary));
          box-shadow: 9999px 0 0 -5px;
          animation: dot-pulse 1.5s infinite linear;
          animation-delay: 0.25s;
        }
        .dot-pulse::before,
        .dot-pulse::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: hsl(var(--primary));
          color: hsl(var(--primary));
        }
        .dot-pulse::before {
          box-shadow: 9984px 0 0 -5px;
          animation: dot-pulse-before 1.5s infinite linear;
          animation-delay: 0s;
        }
        .dot-pulse::after {
          box-shadow: 10014px 0 0 -5px;
          animation: dot-pulse-after 1.5s infinite linear;
          animation-delay: 0.5s;
        }

        @keyframes dot-pulse-before {
          0% {
            box-shadow: 9984px 0 0 -5px;
          }
          30% {
            box-shadow: 9984px 0 0 2px;
          }
          60%,
          100% {
            box-shadow: 9984px 0 0 -5px;
          }
        }
        @keyframes dot-pulse {
          0% {
            box-shadow: 9999px 0 0 -5px;
          }
          30% {
            box-shadow: 9999px 0 0 2px;
          }
          60%,
          100% {
            box-shadow: 9999px 0 0 -5px;
          }
        }
        @keyframes dot-pulse-after {
          0% {
            box-shadow: 10014px 0 0 -5px;
          }
          30% {
            box-shadow: 10014px 0 0 2px;
          }
          60%,
          100% {
            box-shadow: 10014px 0 0 -5px;
          }
        }
      `}</style>
    </div>
  );
}
