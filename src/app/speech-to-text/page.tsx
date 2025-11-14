'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Mic,
  MicOff,
  Loader2,
  FileText,
  FileDown,
  Save,
  Trash2,
  AlertCircle,
  CornerDownLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { speechToTextAndSummarize, SpeechToTextAndSummarizeInput } from '@/ai/flows/speech';
import jsPDF from 'jspdf';
import { font } from '../chart-analyzer/font';

export default function SpeechToTextPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        setHasPermission(false);
      }
    };
    checkPermission();
  }, []);

  const startRecording = async () => {
    if (!hasPermission) {
      toast({
        variant: 'destructive',
        title: 'إذن الميكروفون مطلوب',
        description: 'الرجاء السماح بالوصول إلى الميكروفون لبدء التسجيل.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        toast({ title: 'جاري معالجة الصوت...' });
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
             const input: SpeechToTextAndSummarizeInput = { audioDataUri: base64Audio };
             const result = await speechToTextAndSummarize(input);
             setTranscribedText(result.transcription);
             setSummary(result.summary);
             toast({ title: 'تمت المعالجة بنجاح!', description: 'تم استخراج النص وتلخيصه.' });
          } catch(error) {
              console.error("Error processing audio:", error);
              toast({
                  variant: 'destructive',
                  title: 'فشل في معالجة الصوت',
                  description: 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.',
              });
          } finally {
              setIsProcessing(false);
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscribedText('');
      setSummary('');
      toast({ title: 'بدأ التسجيل...' });

    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        variant: 'destructive',
        title: 'فشل بدء التسجيل',
        description: 'لم نتمكن من الوصول إلى الميكروفون.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'تم إيقاف التسجيل.' });
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
   const handleSummarize = async () => {
    if (!transcribedText || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await speechToTextAndSummarize({ audioDataUri: '', existingText: transcribedText });
      setSummary(result.summary);
      toast({ title: 'تم التلخيص بنجاح!' });
    } catch (error) {
      console.error("Error summarizing text:", error);
      toast({
        variant: 'destructive',
        title: 'فشل التلخيص',
        description: 'حدث خطأ أثناء تلخيص النص.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (content: string, fileName: string, fileType: string) => {
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Cairo-Regular-normal.ttf', font);
    doc.addFont('Cairo-Regular-normal.ttf', 'Cairo-Regular', 'normal');
    doc.setFont('Cairo-Regular');
    
    doc.text("النص المستخرج:", 20, 20);
    doc.text(doc.splitTextToSize(transcribedText, 170), 20, 30);
    
    doc.addPage();
    doc.text("الملخص:", 20, 20);
    doc.text(doc.splitTextToSize(summary, 170), 20, 30);
    
    doc.save('speech_analysis.pdf');
  };
  
  const clearContent = () => {
    setTranscribedText('');
    setSummary('');
    audioChunksRef.current = [];
    toast({ title: 'تم حذف المحتوى.' });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">
          تحويل الكلام إلى نص وتلخيصه
        </h1>
         <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>التسجيل الصوتي</CardTitle>
              <Button
                size="icon"
                variant={isRecording ? 'destructive' : 'default'}
                onClick={handleToggleRecording}
                disabled={hasPermission === null || isProcessing}
                className="w-16 h-16 rounded-full"
              >
                {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : (isRecording ? (
                  <MicOff className="h-7 w-7" />
                ) : (
                  <Mic className="h-7 w-7" />
                ))}
              </Button>
            </CardHeader>
            <CardContent>
              {hasPermission === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>الوصول إلى الميكروفون مرفوض</AlertTitle>
                  <AlertDescription>
                    لاستخدام هذه الميزة، يرجى تمكين الوصول إلى الميكروفون في إعدادات المتصفح.
                  </AlertDescription>
                </Alert>
              )}
               {hasPermission === true && (
                <div className="text-center text-muted-foreground">
                  {isProcessing ? 'جاري المعالجة...' : (isRecording ? 'جاري التسجيل... تحدث الآن.' : 'اضغط على زر الميكروفون لبدء التسجيل.')}
                </div>
               )}
                {hasPermission === null && (
                <div className="text-center text-muted-foreground flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري طلب إذن الوصول إلى الميكروفون...
                </div>
               )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>النص المستخرج</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="سيظهر النص المحول من الصوت هنا..."
                  value={transcribedText}
                  onChange={(e) => setTranscribedText(e.target.value)}
                  className="h-64 resize-none"
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>الملخص</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="سيظهر ملخص النص هنا..."
                  value={summary}
                  readOnly
                  className="h-64 resize-none"
                />
              </CardContent>
              <CardFooter>
                 <Button onClick={handleSummarize} disabled={!transcribedText || isProcessing}>
                  {isProcessing && transcribedText ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileText className="ml-2 h-4 w-4" />}
                  تلخيص النص
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تصدير وحفظ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={exportAsPdf} disabled={!transcribedText && !summary}>
                <FileDown className="ml-2 h-4 w-4" />
                تنزيل PDF
              </Button>
               <Button variant="outline" onClick={() => downloadFile(transcribedText + '\n\nالملخص:\n' + summary, 'analysis.docx', 'application/msword')} disabled={!transcribedText && !summary}>
                <FileDown className="ml-2 h-4 w-4" />
                تنزيل Word
              </Button>
               <Button variant="outline" onClick={() => downloadFile(transcribedText + '\n\nالملخص:\n' + summary, 'analysis.txt', 'text/plain')}>
                <FileDown className="ml-2 h-4 w-4" />
                تنزيل نص
              </Button>
            </CardContent>
             <CardFooter className="border-t pt-6 flex-col items-start gap-4">
               <p className="text-sm font-medium">التحكم بالمحتوى</p>
               <div className="flex w-full max-w-sm items-center space-x-2 space-x-reverse">
                 <Button variant="destructive" onClick={clearContent} disabled={!transcribedText && !summary && audioChunksRef.current.length === 0}>
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف كل شيء
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
