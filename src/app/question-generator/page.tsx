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
import { Upload, FileUp, Settings, BrainCircuit, FileText, Timer, AlertCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function QuestionGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
      } else {
        // You can add a toast notification here to inform the user about invalid file type
        console.error('Invalid file type. Please select an image or a PDF.');
      }
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
                <RadioGroup defaultValue="interactive" className="flex gap-4">
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
                  <Input id="num-questions" type="number" placeholder="غير محدود" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">مستوى الصعوبة</Label>
                   <Select defaultValue="medium">
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
                    <Input type="number" placeholder="ساعات" className='w-24' min="0" />
                    <span className="font-bold">:</span>
                    <Input type="number" placeholder="دقائق" className='w-24' min="0" max="59"/>
                     <span className="font-bold">:</span>
                    <Input type="number" placeholder="ثواني" className='w-24' min="0" max="59"/>
                </div>
              </div>
            </CardContent>
            <CardFooter>
               <Button size="lg" disabled={!file}>
                <BrainCircuit className="ml-2 h-5 w-5" />
                ابدأ إنشاء الأسئلة
              </Button>
            </CardFooter>
          </Card>
           
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>قيد التطوير</AlertTitle>
            <AlertDescription>
                هذا القسم لا يزال قيد الإنشاء. سيتم تفعيل وظائف إنشاء الأسئلة قريبًا.
            </AlertDescription>
          </Alert>

          {/* This section will be for displaying the generated questions */}
          <Card className='hidden'>
             <CardHeader>
                <CardTitle>الأسئلة التي تم إنشاؤها</CardTitle>
             </CardHeader>
             <CardContent>
                {/* Questions will be rendered here */}
             </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
