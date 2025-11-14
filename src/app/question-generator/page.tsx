'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Upload, FileUp, Settings, BrainCircuit, FileText, Timer, AlertCircle, Loader2, CornerDownLeft, CheckCircle, XCircle, Printer } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { generateQuestions, GenerateQuestionsInput, GenerateQuestionsOutput, GeneratedQuestion } from '@/ai/flows/question-generator';
import { cn } from '@/lib/utils';

type AnswerState = {
  selectedOption: string | null;
  isCorrect: boolean | null;
};

export default function QuestionGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Form state
  const [questionType, setQuestionType] = useState<'interactive' | 'fixed'>('interactive');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timerSettings, setTimerSettings] = useState({ hours: 0, minutes: 5, seconds: 0 });
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive state
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);

  useEffect(() => {
    if (isTestStarted && remainingTime > 0 && !showResults) {
      const id = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
      setTimerId(id);
    } else if (remainingTime === 0 && isTestStarted) {
      if (timerId) clearInterval(timerId);
      setShowResults(true);
      toast({
        title: "انتهى الوقت!",
        description: "تم عرض نتائج الاختبار.",
      });
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isTestStarted, remainingTime, showResults]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setGeneratedQuestions([]);
        setError(null);
        setAnswers([]);
        setShowResults(false);
        setIsTestStarted(false);
        if(timerId) clearInterval(timerId);
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
    setAnswers([]);
    setShowResults(false);
    setIsTestStarted(false);
     if(timerId) clearInterval(timerId);
    
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
          setAnswers(Array(result.questions.length).fill({ selectedOption: null, isCorrect: null }));
          toast({
            title: 'تم إنشاء الأسئلة بنجاح!',
          });
          if(questionType === 'interactive'){
            const totalSeconds = timerSettings.hours * 3600 + timerSettings.minutes * 60 + timerSettings.seconds;
            setRemainingTime(totalSeconds);
            setIsTestStarted(true);
          }
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

  const handleAnswerSelect = (questionIndex: number, selectedOption: string) => {
    if(showResults) return;

    const newAnswers = [...answers];
    const isCorrect = generatedQuestions[questionIndex].correctAnswer === selectedOption;
    newAnswers[questionIndex] = { selectedOption, isCorrect };
    setAnswers(newAnswers);
  };
  
  const calculateScore = () => {
    return answers.filter(a => a.isCorrect).length;
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4 print:hidden">
        <h1 className="text-xl font-bold text-primary">مولد الأسئلة</h1>
         <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <Card className="print:hidden">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center cursor-pointer border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors"
             onClick={() => fileInputRef.current?.click()}
            >
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

          <Card className="print:hidden">
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
                    <Input disabled={isGenerating || questionType === 'fixed'} type="number" placeholder="ساعات" className='w-24' min="0" value={timerSettings.hours} onChange={(e) => setTimerSettings(t => ({ ...t, hours: parseInt(e.target.value) || 0 }))}/>
                    <span className="font-bold">:</span>
                    <Input disabled={isGenerating || questionType === 'fixed'} type="number" placeholder="دقائق" className='w-24' min="0" max="59" value={timerSettings.minutes} onChange={(e) => setTimerSettings(t => ({ ...t, minutes: parseInt(e.target.value) || 0 }))}/>
                     <span className="font-bold">:</span>
                    <Input disabled={isGenerating || questionType === 'fixed'} type="number" placeholder="ثواني" className='w-24' min="0" max="59" value={timerSettings.seconds} onChange={(e) => setTimerSettings(t => ({ ...t, seconds: parseInt(e.target.value) || 0 }))}/>
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
            <Alert variant="destructive" className="print:hidden">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>حدث خطأ</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
          )}

          {generatedQuestions.length > 0 && !isGenerating && (
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>الأسئلة التي تم إنشاؤها</CardTitle>
                        <CardDescription>
                          {questionType === 'interactive' ? 'أجب على الأسئلة أدناه واختبر معلوماتك.' : 'استعرض الأسئلة وإجاباتها الصحيحة.'}
                        </CardDescription>
                    </div>
                     {questionType === 'fixed' && (
                        <Button variant="outline" onClick={handlePrint} className="print:hidden">
                            <Printer className="ml-2 h-4 w-4" />
                            طباعة
                        </Button>
                     )}
                </CardHeader>
                 {isTestStarted && !showResults && (
                    <div className="p-4 border-t text-center">
                        <p className="text-lg font-bold text-primary tabular-nums">{formatTime(remainingTime)}</p>
                        <p className="text-sm text-muted-foreground">الوقت المتبقي</p>
                    </div>
                )}
                <CardContent className='space-y-6 pt-6'>
                    {generatedQuestions.map((q, index) => (
                        <div key={index} className='space-y-4 p-4 border rounded-lg bg-muted/30 print:border-0 print:p-0 print:bg-transparent print:break-inside-avoid'>
                            <p className='font-bold flex items-start gap-2'>
                              <span>{index + 1}.</span>
                              <span>{q.question}</span>
                            </p>

                            {questionType === 'fixed' && (
                                <>
                                  <div className='space-y-2 pr-6'>
                                      {q.options.map((opt, i) => (
                                          <p key={i} className={cn("text-sm", q.correctAnswer === opt ? 'text-green-400 font-semibold flex items-center gap-2' : 'text-muted-foreground')}>
                                             {q.correctAnswer === opt && <CheckCircle className="size-4" />}
                                             {opt}
                                          </p>
                                      ))}
                                  </div>
                                  <Alert className='mt-2 bg-background/50'>
                                      <FileText className="h-4 w-4" />
                                      <AlertTitle>الشرح</AlertTitle>
                                      <AlertDescription>{q.explanation}</AlertDescription>
                                  </Alert>
                                </>
                            )}
                            
                            {questionType === 'interactive' && (
                              <>
                                <RadioGroup 
                                  value={answers[index]?.selectedOption || ''}
                                  onValueChange={(value) => handleAnswerSelect(index, value)}
                                  className='space-y-2 pr-6'
                                  disabled={showResults}
                                >
                                  {q.options.map((option, i) => {
                                      const answer = answers[index];
                                      const isSelected = answer?.selectedOption === option;
                                      const isCorrect = q.correctAnswer === option;
                                      
                                      let stateIndicator = null;
                                      if (showResults && isSelected) {
                                          stateIndicator = isCorrect 
                                              ? <CheckCircle className="size-5 text-green-500" /> 
                                              : <XCircle className="size-5 text-red-500" />;
                                      } else if (showResults && isCorrect) {
                                          stateIndicator = <CheckCircle className="size-5 text-green-500" />;
                                      }

                                      return (
                                        <Label 
                                          key={i}
                                          htmlFor={`q${index}-opt${i}`}
                                          className={cn(
                                            "flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors hover:bg-background/50",
                                            showResults && isCorrect && "border-green-500 bg-green-500/10",
                                            showResults && isSelected && !isCorrect && "border-red-500 bg-red-500/10"
                                          )}
                                        >
                                          <RadioGroupItem value={option} id={`q${index}-opt${i}`} />
                                          <span className="flex-1">{option}</span>
                                          {stateIndicator}
                                        </Label>
                                      );
                                  })}
                                </RadioGroup>
                                {showResults && (
                                  <Alert className={cn('mt-2', answers[index]?.isCorrect ? 'border-green-500/50' : 'border-red-500/50')}>
                                      <FileText className="h-4 w-4" />
                                      <AlertTitle className={answers[index]?.isCorrect ? 'text-green-400' : 'text-red-400'}>
                                        {answers[index]?.isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
                                      </AlertTitle>
                                      <AlertDescription>{q.explanation}</AlertDescription>
                                  </Alert>
                                )}
                              </>
                            )}
                        </div>
                    ))}
                </CardContent>
                {questionType === 'interactive' && (
                   <CardFooter className="flex-col items-stretch gap-4 print:hidden">
                     {showResults && (
                       <Alert variant="default" className="border-primary">
                          <BrainCircuit className="h-4 w-4" />
                          <AlertTitle>نتيجتك النهائية</AlertTitle>
                          <AlertDescription>
                            لقد حصلت على {calculateScore()} من {generatedQuestions.length} إجابات صحيحة.
                          </AlertDescription>
                       </Alert>
                     )}
                     <Button size="lg" onClick={() => setShowResults(!showResults)}>
                       {showResults ? 'إخفاء النتائج' : 'إظهار النتائج'}
                     </Button>
                   </CardFooter>
                )}
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}