'use client';

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SpeechToTextPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        // We don't need the stream here, just to check permission.
        // Closing the stream to turn off the mic indicator.
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        setHasPermission(false);
      }
    };
    checkPermission();
  }, []);


  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording logic will go here
      setIsRecording(false);
      toast({ title: 'تم إيقاف التسجيل.' });
    } else {
      // Start recording logic will go here
      if(hasPermission) {
        setIsRecording(true);
        toast({ title: 'بدأ التسجيل...' });
      } else {
         toast({
          variant: 'destructive',
          title: 'إذن الميكروفون مطلوب',
          description: 'الرجاء السماح بالوصول إلى الميكروفون لبدء التسجيل.',
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">
          تحويل الكلام إلى نص وتلخيصه
        </h1>
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
                disabled={hasPermission === null}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {hasPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>الوصول إلى الميكروفون مرفوض</AlertTitle>
                  <AlertDescription>
                    لاستخدام هذه الميزة، يرجى تمكين الوصول إلى الميكروفون في إعدادات المتصفح.
                  </AlertDescription>
                </Alert>
              )}
               {hasPermission === true && (
                <div className="text-center text-muted-foreground">
                  {isRecording ? 'جاري التسجيل... تحدث الآن.' : 'اضغط على زر الميكروفون لبدء التسجيل.'}
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
                  readOnly
                  className="h-64 resize-none"
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
                 <Button disabled={!transcribedText || isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
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
              <Button variant="outline" disabled={!transcribedText}>
                <FileDown className="ml-2 h-4 w-4" />
                تنزيل PDF
              </Button>
               <Button variant="outline" disabled={!transcribedText}>
                <FileDown className="ml-2 h-4 w-4" />
                تنزيل Word
              </Button>
               <Button variant="outline" disabled={!transcribedText}>
                <FileDown className="ml-2 h-4 w-4" />
                تنزيل PowerPoint
              </Button>
               <Button variant="outline" disabled={!transcribedText}>
                <FileDown className="ml-2 h-4 w-4" />
                تنزيل نص
              </Button>
            </CardContent>
             <CardFooter className="border-t pt-6 flex-col items-start gap-4">
               <p className="text-sm font-medium">حفظ التسجيل الصوتي</p>
               <div className="flex w-full max-w-sm items-center space-x-2 space-x-reverse">
                <Button variant="outline" disabled={!transcribedText}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ
                </Button>
                 <Button variant="destructive" disabled={!transcribedText}>
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
