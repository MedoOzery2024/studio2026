'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import { Upload, FileUp, Settings, AudioLines, Loader2, AlertCircle, Download, CornerDownLeft, Play, Pause, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { textToSpeech, TextToSpeechInput } from '@/ai/flows/text-to-speech';

export default function TextToSpeechPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [outputFileName, setOutputFileName] = useState('generated-speech');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setGeneratedAudio(null);
        setError(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'نوع ملف غير صالح',
          description: 'الرجاء اختيار صورة أو ملف PDF.',
        });
      }
    }
  };
  
  const clearFile = () => {
    setFile(null);
    setFileName('');
    setGeneratedAudio(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleGenerateClick = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'لم يتم اختيار ملف',
        description: 'الرجاء تحميل صورة أو ملف PDF أولاً.',
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedAudio(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const input: TextToSpeechInput = {
          fileDataUri: base64Data,
        };

        const result = await textToSpeech(input);

        if (result && result.audioDataUri) {
          setGeneratedAudio(result.audioDataUri);
          toast({
            title: 'تم إنشاء الملف الصوتي بنجاح!',
          });
        } else {
          setError('لم يتمكن الذكاء الاصطناعي من إنشاء ملف صوتي من هذا المحتوى.');
        }
      };
      
      reader.onerror = () => {
        throw new Error('فشل في قراءة الملف.');
      };

    } catch (e: any) {
      console.error('Error generating speech:', e);
      setError(e.message || 'حدث خطأ غير متوقع أثناء إنشاء الملف الصوتي.');
      toast({
        variant: 'destructive',
        title: 'فشل الإنشاء',
        description: e.message || 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = () => {
    if (!generatedAudio) return;
    const a = document.createElement('a');
    a.href = generatedAudio;
    a.download = `${outputFileName.trim() || 'generated-speech'}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">تحويل النص إلى كلام</h1>
         <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
          {!file ? (
             <Card
              className="border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors"
              onClick={() => !isGenerating && fileInputRef.current?.click()}
             >
                <CardContent className="flex flex-col items-center justify-center p-12 text-center cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-semibold">
                    انقر أو اسحب صورة أو ملف PDF هنا
                  </p>
                  <p className="text-sm text-muted-foreground">
                    سيتم استخراج النص وتحويله إلى كلام.
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isGenerating}
                  />
                </CardContent>
             </Card>
          ) : (
            <Card>
                <CardHeader>
                    <CardTitle>الملف المحدد</CardTitle>
                </CardHeader>
                <CardContent className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 text-sm'>
                        <FileUp className='size-6 text-primary'/>
                        <span className='font-medium'>{fileName}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearFile} disabled={isGenerating}>
                        <Trash2 className="size-5 text-destructive"/>
                    </Button>
                </CardContent>
            </Card>
          )}


          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="size-6 text-primary" />
                <CardTitle>إعدادات الصوت</CardTitle>
              </div>
              <CardDescription>
                سيتم إنشاء الملف الصوتي باستخدام صوت رجل.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="output-filename">اسم الملف الصوتي الناتج</Label>
                  <Input 
                    id="output-filename" 
                    placeholder="generated-speech" 
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
            </CardContent>
            <CardFooter>
               <Button size="lg" disabled={!file || isGenerating} onClick={handleGenerateClick}>
                {isGenerating ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <AudioLines className="ml-2 h-5 w-5" />}
                {isGenerating ? 'جاري إنشاء الصوت...' : 'ابدأ التحويل إلى كلام'}
              </Button>
            </CardFooter>
          </Card>
           
          {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>حدث خطأ</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
          )}
          
          {isGenerating && (
             <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-lg">يقوم الذكاء الاصطناعي بتحويل النص إلى كلام... قد يستغرق هذا بعض الوقت.</p>
                  </div>
                </CardContent>
            </Card>
          )}

          {generatedAudio && !isGenerating && (
            <Card>
                <CardHeader>
                    <CardTitle>الملف الصوتي جاهز</CardTitle>
                    <CardDescription>يمكنك الاستماع إلى الملف الصوتي الذي تم إنشاؤه أو تنزيله.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 border-t pt-6'>
                    <div className='flex items-center gap-4 bg-muted p-4 rounded-lg'>
                        <Button size="icon" onClick={togglePlayPause}>
                           {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
                        </Button>
                        <div className="flex-1 text-center font-semibold">استمع الآن</div>
                        <audio
                            ref={audioRef}
                            src={generatedAudio}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                     <Button onClick={handleDownload}>
                      <Download className="ml-2 h-4 w-4" />
                      تنزيل الملف الصوتي (.wav)
                    </Button>
                </CardFooter>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
