'use client';

import { useState, useRef } from 'react';
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
import { Upload, FileUp, Settings, AudioLines, User, Wrench, Loader2, AlertCircle, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

  // Form state
  const [voice, setVoice] = useState<'male' | 'female'>('female');

  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


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
          voice,
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
        description: 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.',
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
  
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">تحويل النص إلى كلام</h1>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <Card
            className="border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
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
                <CardTitle>إعدادات الصوت</CardTitle>
              </div>
              <CardDescription>
                حدد خياراتك لإنشاء ملف صوتي مخصص.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>اختر الصوت</Label>
                <RadioGroup 
                  value={voice}
                  onValueChange={(val: 'male' | 'female') => setVoice(val)}
                  className="flex gap-4"
                  disabled={isGenerating}
                >
                  <Label htmlFor="female" className="flex items-center gap-2 cursor-pointer p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                    <RadioGroupItem value="female" id="female" />
                    <Wrench className="size-5" />
                    <span>صوت امرأة</span>
                  </Label>
                   <Label htmlFor="male" className="flex items-center gap-2 cursor-pointer p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                    <RadioGroupItem value="male" id="male" />
                     <User className="size-5" />
                    <span>صوت رجل</span>
                  </Label>
                </RadioGroup>
              </div>
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
                    <audio controls className="w-full">
                        <source src={generatedAudio} type="audio/wav" />
                        متصفحك لا يدعم عنصر الصوت.
                    </audio>
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
