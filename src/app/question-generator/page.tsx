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
import { Upload, FileUp, Settings, BrainCircuit, FileText, Timer, AlertCircle, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateQuestions, GenerateQuestionsInput, GenerateQuestionsOutput, GeneratedQuestion } from '@/ai/flows/question-generator';

export default function QuestionGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Form state
  const [questionType, setQuestionType] = useState<'interactive' | 'fixed'>('interactive');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setGeneratedQuestions([]);
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
    setGeneratedQuestions([]);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const input: GenerateQuestionsInput = {
          fileDataUri: base64Data,
          questionType,
          numQuestions,
          difficulty,
        };

        const result = await generateQuestions(input);

        if (result && result.questions.length > 0) {
          setGeneratedQuestions(result.questions);
          toast({
            title: 'تم إنشاء الأسئلة بنجاح!',
          });
        } else {
          setError('لم يتمكن الذكاء الاصطناعي من إنشاء أسئلة من هذا المحتوى. حاول مرة أخرى بملف مختلف.');
        }
      };
      
      reader.onerror = () => {
        throw new Error('فشل في قراءة الملف.');
      };

    } catch (e: any) {
      console.error('Error generating questions:', e);
      setError(e.message || 'حدث خطأ غير متوقع أثناء إنشاء الأسئلة.');
      toast({
        variant: 'destructive',
        title: 'فشل الإنشاء',
        description: 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">مولد الأسئلة</h1>
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
                سيتم تحليل المحتوى لإنشاء الأسئلة.
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
                <CardTitle>إعدادات إنشاء الأسئلة</CardTitle>
              </div>
              <CardDescription>
                حدد خياراتك لإنشاء أسئلة مخصصة بناءً على المحتوى الذي تم تحميله.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>نوع الأسئلة</Label>
                <RadioGroup 
                  value={questionType}
                  onValueChange={(val: 'interactive' | 'fixed') => setQuestionType(val)}
                  className="flex gap-4"
                  disabled={isGenerating}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="interactive" id="interactive" />
                    <Label htmlFor="interactive">أسئلة تفاعلية</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">أسئلة ثابتة</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num-questions">عدد الأسئلة</Label>
                  <Input 
                    id="num-questions" 
                    type="number" 
                    placeholder="10" 
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 1)}
                    min="1"
                    max="50"
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">مستوى الصعوبة</Label>
                   <Select 
                     value={difficulty}
                     onValueChange={(val: 'easy' | 'medium' | 'hard') => setDifficulty(val)}
                     disabled={isGenerating}
                    >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">سهل</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="hard">صعب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

               <div className="space-y-2">
                <Label>مؤقت الاختبار (للأسئلة التفاعلية)</Label>
                <div className="flex items-center gap-2">
                    <Timer className='size-5 text-muted-foreground'/>
                    <Input disabled={isGenerating || questionType === 'fixed'} type="number" placeholder="ساعات" className='w-24' min="0" value={timer.hours} onChange={(e) => setTimer(t => ({ ...t, hours: parseInt(e.target.value) || 0 }))}/>
                    <span className="font-bold">:</span>
                    <Input disabled={isGenerating || questionType === 'fixed'} type="number" placeholder="دقائق" className='w-24' min="0" max="59" value={timer.minutes} onChange={(e) => setTimer(t => ({ ...t, minutes: parseInt(e.target.value) || 0 }))}/>
                     <span className="font-bold">:</span>
                    <Input disabled={isGenerating || questionType === 'fixed'} type="number" placeholder="ثواني" className='w-24' min="0" max="59" value={timer.seconds} onChange={(e) => setTimer(t => ({ ...t, seconds: parseInt(e.target.value) || 0 }))}/>
                </div>
              </div>
            </CardContent>
            <CardFooter>
               <Button size="lg" disabled={!file || isGenerating} onClick={handleGenerateClick}>
                {isGenerating ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <BrainCircuit className="ml-2 h-5 w-5" />}
                {isGenerating ? 'جاري إنشاء الأسئلة...' : 'ابدأ إنشاء الأسئلة'}
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

          {/* This section will be for displaying the generated questions */}
          {generatedQuestions.length > 0 && !isGenerating && (
            <Card>
                <CardHeader>
                    <CardTitle>الأسئلة التي تم إنشاؤها</CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                    {generatedQuestions.map((q, index) => (
                        <div key={index} className='space-y-3 p-4 border rounded-lg'>
                            <p className='font-bold'>{index + 1}. {q.question}</p>
                            <div className='space-y-2 pr-4'>
                                {q.options.map((opt, i) => (
                                    <p key={i} className={`text-sm ${q.correctAnswer === opt ? 'text-green-400 font-semibold' : 'text-muted-foreground'}`}>{opt}</p>
                                ))}
                            </div>
                            {questionType === 'fixed' && (
                                <Alert className='mt-2'>
                                    <FileText className="h-4 w-4" />
                                    <AlertTitle>الشرح</AlertTitle>
                                    <AlertDescription>{q.explanation}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
