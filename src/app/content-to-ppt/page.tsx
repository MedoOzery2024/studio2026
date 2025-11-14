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
import { Upload, FileUp, Presentation, Loader2, AlertCircle, Download, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export default function ContentToPptPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPptUrl, setGeneratedPptUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState('presentation');


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setGeneratedPptUrl(null);
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
    
    // This is a placeholder for the actual generation logic
    setIsGenerating(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing
    setError("ميزة إنشاء العروض التقديمية قيد التطوير حاليًا. يرجى المحاولة مرة أخرى لاحقًا.");
    toast({
        variant: "default",
        title: "تحت التطوير",
        description: "هذه الميزة لا تزال قيد الإنشاء.",
    });
    setIsGenerating(false);
  };
  
    const handleDownload = () => {
    if (!generatedPptUrl) return;
    const a = document.createElement('a');
    a.href = generatedPptUrl;
    a.download = `${outputFileName.trim() || 'presentation'}.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">تحويل المحتوى إلى PowerPoint</h1>
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
                انقر أو اسحب صورة أو ملف PDF هنا
              </p>
              <p className="text-sm text-muted-foreground">
                سيتم تحليل المحتوى وتحويله إلى عرض تقديمي.
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
                <CardTitle>إعدادات العرض التقديمي</CardTitle>
              </div>
              <CardDescription>
                حدد خياراتك لإنشاء عرض تقديمي مخصص.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="output-filename">اسم ملف العرض التقديمي</Label>
                  <Input 
                    id="output-filename" 
                    placeholder="presentation" 
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
            </CardContent>
            <CardFooter>
               <Button size="lg" disabled={!file || isGenerating} onClick={handleGenerateClick}>
                {isGenerating ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <Presentation className="ml-2 h-5 w-5" />}
                {isGenerating ? 'جاري إنشاء العرض...' : 'ابدأ التحويل'}
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
                    <p className="text-lg">يقوم الذكاء الاصطناعي بتحليل المحتوى وتصميمه في عرض تقديمي...</p>
                  </div>
                </CardContent>
            </Card>
          )}

          {generatedPptUrl && !isGenerating && (
            <Card>
                <CardHeader>
                    <CardTitle>العرض التقديمي جاهز</CardTitle>
                    <CardDescription>يمكنك الآن تنزيل ملف PowerPoint الذي تم إنشاؤه.</CardDescription>
                </CardHeader>
                <CardFooter>
                     <Button onClick={handleDownload}>
                      <Download className="ml-2 h-4 w-4" />
                      تنزيل العرض التقديمي (.pptx)
                    </Button>
                </CardFooter>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
