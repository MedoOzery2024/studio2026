'use client';

import { useState, useRef, Fragment } from 'react';
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
import { Upload, FileUp, BrainCircuit, Loader2, AlertCircle, Download, File, Share2, CornerDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateMindMap, GenerateMindMapInput, MindMapNode } from '@/ai/flows/mind-map-generator';

// Recursive component to render the mind map
const MindMapNodeComponent = ({ node, level }: { node: MindMapNode, level: number }) => {
  const levelColor = `hsl(var(--primary) / ${1 - level * 0.2})`;
  return (
    <div className={`space-y-2 ${level > 0 ? 'pr-4 border-r-2' : ''}`} style={{ borderColor: level > 0 ? levelColor : 'transparent' }}>
      <details open={level < 2} className="group">
        <summary className="cursor-pointer font-bold text-lg flex items-center gap-2">
           <Share2 className="size-4 text-primary transition-transform group-open:rotate-90" style={{ color: levelColor }} />
          <span style={{ color: levelColor }}>{node.title}</span>
        </summary>
        <p className="mt-1 text-muted-foreground pr-6 pb-2">{node.details}</p>
        {node.subIdeas && node.subIdeas.length > 0 && (
          <div className="space-y-4 pt-2">
            {node.subIdeas.map((subNode, index) => (
              <MindMapNodeComponent key={index} node={subNode} level={level + 1} />
            ))}
          </div>
        )}
      </details>
    </div>
  );
};


export default function MindMapGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMindMap, setGeneratedMindMap] = useState<MindMapNode | null>(null);
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

    try {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const input: GenerateMindMapInput = { fileDataUri: base64Data };
          
          const result = await generateMindMap(input);

          if (result) {
            setGeneratedMindMap(result);
            toast({
              title: 'تم إنشاء الخريطة الذهنية بنجاح!',
              description: 'يمكنك الآن استعراضها وتصديرها.',
            });
          } else {
             setError('لم يتمكن الذكاء الاصطناعي من إنشاء خريطة ذهنية. حاول مرة أخرى بملف مختلف.');
          }
       }
       reader.onerror = () => {
         throw new Error('فشل في قراءة الملف.');
       }
    } catch(e: any) {
        console.error("Error generating mind map:", e);
        setError(e.message || 'حدث خطأ غير متوقع أثناء إنشاء الخريطة الذهنية.');
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
        <h1 className="text-xl font-bold text-primary">صانع الخرائط الذهنية</h1>
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

          {isGenerating && (
             <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-lg">يقوم الذكاء الاصطناعي بتحليل المحتوى ورسم الخريطة... قد يستغرق هذا بعض الوقت.</p>
                  </div>
                </CardContent>
            </Card>
          )}

          {generatedMindMap && !isGenerating && (
            <Card>
                <CardHeader>
                    <CardTitle>الخريطة الذهنية</CardTitle>
                    <CardDescription>هذه هي الخريطة الذهنية التي تم إنشاؤها من ملفك. يمكنك الآن استعراضها وتصديرها.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6 border-t pt-6'>
                    <div className='p-4 border rounded-lg bg-muted/20'>
                       <MindMapNodeComponent node={generatedMindMap} level={0} />
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
