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
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileUp, FileText, Loader2, AlertCircle, CornerDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { summarizeDocument, SummarizeDocumentInput, SummarizeDocumentOutput } from '@/ai/flows/document-summarizer';


export default function DocumentSummarizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummarizeDocumentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setSummaryResult(null);
        setError(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'نوع ملف غير صالح',
          description: 'الرجاء اختيار ملف PDF فقط.',
        });
      }
    }
  };

  const handleSummarizeClick = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'لم يتم اختيار ملف',
        description: 'الرجاء تحميل ملف PDF أولاً.',
      });
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummaryResult(null);

     try {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const input: SummarizeDocumentInput = { fileDataUri: base64Data };
          
          const result = await summarizeDocument(input);

          if (result) {
            setSummaryResult(result);
            toast({
              title: 'تم تلخيص المستند بنجاح!',
            });
          } else {
             setError('لم يتمكن الذكاء الاصطناعي من تلخيص المستند. حاول مرة أخرى بملف مختلف.');
          }
       }
       reader.onerror = () => {
         throw new Error('فشل في قراءة الملف.');
       }
    } catch(e: any) {
        console.error("Error summarizing document:", e);
        setError(e.message || 'حدث خطأ غير متوقع أثناء تلخيص المستند.');
        toast({
            variant: 'destructive',
            title: 'فشل التلخيص',
            description: 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.',
        });
    } finally {
        setIsSummarizing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">ملخص المستندات</h1>
         <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <Card
            className="border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors"
            onClick={() => !isSummarizing && fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-12 text-center cursor-pointer">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">
                انقر أو اسحب ملف PDF هنا
              </p>
              <p className="text-sm text-muted-foreground">
                سيتم تلخيص محتوى الملف.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isSummarizing}
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
                <CardTitle>تلخيص المستند</CardTitle>
                <CardDescription>
                  اضغط على الزر أدناه لبدء تلخيص ملف PDF الذي تم تحميله.
                </CardDescription>
             </CardHeader>
            <CardFooter>
               <Button size="lg" disabled={!file || isSummarizing} onClick={handleSummarizeClick}>
                {isSummarizing ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <FileText className="ml-2 h-5 w-5" />}
                {isSummarizing ? 'جاري التلخيص...' : 'ابدأ التلخيص'}
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

          {isSummarizing && (
             <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-lg">يقوم الذكاء الاصطناعي بقراءة وتلخيص المستند...</p>
                  </div>
                </CardContent>
            </Card>
          )}

          {summaryResult && !isSummarizing && (
            <Card>
                <CardHeader>
                    <CardTitle>الملخص</CardTitle>
                    <CardDescription>هذا هو ملخص المستند الذي تم إنشاؤه.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6 border-t pt-6'>
                    <Textarea
                        readOnly
                        value={summaryResult.summary}
                        className="h-64 resize-none text-base leading-relaxed"
                     />
                </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
