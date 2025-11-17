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
import { Upload, FileUp, Settings, Video, Loader2, AlertCircle, Download, CornerDownLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { generateVideo, GenerateVideoInput } from '@/ai/flows/video-generator';


export default function VideoGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Form State
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState([5]);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError(null);
        setGeneratedVideo(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'نوع ملف غير صالح',
          description: 'الرجاء اختيار ملف صورة، PDF، أو نصي.',
        });
      }
    }
  };

  const handleGenerateClick = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'لم يتم اختيار ملف',
        description: 'الرجاء تحميل ملف أولاً.',
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);

    toast({
        title: 'بدء إنشاء الفيديو',
        description: 'قد تستغرق هذه العملية عدة دقائق. يرجى الانتظار بصبر.'
    });

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64Data = reader.result as string;

            const input: GenerateVideoInput = {
                prompt,
                fileDataUri: base64Data,
                durationSeconds: duration[0],
                aspectRatio,
            };

            const result = await generateVideo(input);
            if (result && result.videoUrl) {
                setGeneratedVideo(result.videoUrl);
                toast({
                    title: 'اكتمل إنشاء الفيديو بنجاح!',
                    description: 'الفيديو جاهز للعرض أدناه.'
                });
            } else {
                throw new Error('فشل إنشاء الفيديو. لم يتم إرجاع أي فيديو.');
            }
        };
        reader.onerror = () => {
            throw new Error('فشل في قراءة الملف.');
        }

    } catch (e: any) {
        console.error("Error generating video:", e);
        const errorMessage = e.message || 'حدث خطأ غير متوقع أثناء إنشاء الفيديو.';
        setError(errorMessage);
        toast({
            variant: 'destructive',
            title: 'فشل إنشاء الفيديو',
            description: errorMessage,
        });
    } finally {
        setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">منشئ الفيديو التعليمي</h1>
         <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <Card
            className="border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors"
            onClick={() => !isGenerating && fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-12 text-center cursor-pointer">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">
                انقر أو اسحب ملف (نص، صورة، PDF) هنا
              </p>
              <p className="text-sm text-muted-foreground">
                سيتم تحليل المحتوى وتحويله إلى فيديو.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf,text/plain"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isGenerating}
              />
            </CardContent>
             {fileName && (
              <CardFooter className='border-t p-4'>
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <FileUp className='size-5'/>
                    <span>{fileName}</span>
                </div>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="size-6 text-primary" />
                <CardTitle>إعدادات الفيديو</CardTitle>              </div>
              <CardDescription>
                حدد خيارات الفيديو الذي سيتم إنشاؤه.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">الموجه (Prompt)</Label>
                  <Input 
                    id="prompt" 
                    placeholder="مثال: فيديو سينمائي لسيارة قديمة تسير في طريق مهجور عند غروب الشمس" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    اكتب وصفًا للمشهد الذي تريده. إذا كنت تستخدم صورة، يمكنك وصف الحركة التي تريد إضافتها.
                  </p>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className="space-y-2">
                      <Label htmlFor="duration">مدة الفيديو (بالثواني)</Label>
                      <div className='flex items-center gap-4'>
                        <Slider
                            id="duration"
                            min={2} max={8} step={1}
                            value={duration}
                            onValueChange={setDuration}
                            disabled={isGenerating}
                        />
                        <span className='font-mono text-lg'>{duration[0]}s</span>
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="aspect-ratio">نسبة العرض إلى الارتفاع</Label>
                      <Select 
                        value={aspectRatio}
                        onValueChange={setAspectRatio}
                        disabled={isGenerating}
                      >
                        <SelectTrigger id="aspect-ratio">
                          <SelectValue placeholder="اختر النسبة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (أفقي)</SelectItem>
                          <SelectItem value="9:16">9:16 (عمودي)</SelectItem>
                          <SelectItem value="1:1">1:1 (مربع)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
               <Button size="lg" disabled={!file || !prompt || isGenerating} onClick={handleGenerateClick}>
                {isGenerating ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <Video className="ml-2 h-5 w-5" />}
                {isGenerating ? 'جاري إنشاء الفيديو...' : 'ابدأ إنشاء الفيديو'}
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
                  <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-lg">يقوم الذكاء الاصطناعي بإنشاء الفيديو...</p>
                    <p className="text-sm">قد تستغرق هذه العملية عدة دقائق. يرجى عدم إغلاق الصفحة.</p>
                  </div>
                </CardContent>
            </Card>
          )}

          {generatedVideo && !isGenerating && (
             <Card>
                <CardHeader>
                    <CardTitle>الفيديو جاهز</CardTitle>
                </CardHeader>
                <CardContent>
                    <video controls muted autoPlay loop className="w-full rounded-lg">
                        <source src={generatedVideo} type="video/mp4" />
                        متصفحك لا يدعم عرض الفيديوهات.
                    </video>
                </CardContent>
                <CardFooter>
                    <a href={generatedVideo} download="generated_video.mp4">
                        <Button>
                           <Download className="ml-2 h-4 w-4" />
                            تنزيل الفيديو
                        </Button>
                    </a>
                </CardFooter>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
