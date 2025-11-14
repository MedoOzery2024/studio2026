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
import { Upload, FileUp, BrainCircuit, Loader2, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MindMapGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMindMap, setGeneratedMindMap] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setGeneratedMindMap(null);
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
    setGeneratedMindMap(null);

    // AI generation logic will go here in the next step
    // For now, let's simulate a delay
    setTimeout(() => {
      //
      // setGeneratedMindMap({ mainIdea: 'Example', subIdeas: [] });
      toast({
        title: 'جاري التطوير...',
        description: 'سيتم تفعيل إنشاء الخرائط الذهنية قريباً.',
      });
       setIsGenerating(false);
    }, 2000);
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">صانع الخرائط الذهنية</h1>
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
                سيتم تحليل المحتوى لإنشاء خريطة ذهنية.
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
                <CardTitle>إعدادات الخريطة الذهنية</CardTitle>
                <CardDescription>
                  اضغط على الزر أدناه لبدء إنشاء خريطتك الذهنية من المحتوى الذي تم تحميله.
                </CardDescription>
             </CardHeader>
            <CardFooter>
               <Button size="lg" disabled={!file || isGenerating} onClick={handleGenerateClick}>
                {isGenerating ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <BrainCircuit className="ml-2 h-5 w-5" />}
                {isGenerating ? 'جاري إنشاء الخريطة...' : 'إنشاء الخريطة الذهنية'}
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

          {/* This section will be for displaying the generated mind map */}
          {generatedMindMap && !isGenerating && (
            <Card>
                <CardHeader>
                    <CardTitle>الخريطة الذهنية</CardTitle>
                    <CardDescription>هذه هي الخريطة الذهنية التي تم إنشاؤها من ملفك. يمكنك الآن تصديرها.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6 border-t pt-6'>
                    {/* Placeholder for mind map visualization */}
                    <div className='p-4 border rounded-lg bg-muted/20'>
                      <p className='font-bold text-center'>سيتم عرض الخريطة الذهنية هنا</p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" disabled>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير كـ PDF
                  </Button>
                  <Button variant="outline" disabled>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير كـ PowerPoint
                  </Button>
                </CardFooter>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
