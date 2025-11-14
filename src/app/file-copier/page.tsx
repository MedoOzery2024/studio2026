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
import { Upload, FileUp, Download, Copy, CornerDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FileCopierPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      toast({
        title: 'تم تحميل الملف بنجاح',
        description: `الملف "${selectedFile.name}" جاهز للنسخ.`,
      });
    }
  };

  const handleDownloadCopy = () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'لم يتم اختيار ملف',
        description: 'الرجاء تحميل ملف لنسخه أولاً.',
      });
      return;
    }

    // Create a Blob from the file
    const blob = new Blob([file], { type: file.type });
    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `copy_of_${file.name}`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
        title: 'تم تنزيل النسخة',
        description: `تم بدء تنزيل نسخة من ملفك.`,
      });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">ناسخ الملفات</h1>
         <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
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
                انقر أو اسحب أي ملف هنا
              </p>
              <p className="text-sm text-muted-foreground">
                يمكنك رفع أي نوع من الملفات لإنشاء نسخة منه.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
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
                <CardTitle>تنزيل النسخة</CardTitle>
                <CardDescription>
                  بعد رفع الملف، اضغط على الزر أدناه لتنزيل نسخة منه.
                </CardDescription>
             </CardHeader>
            <CardFooter>
               <Button size="lg" disabled={!file} onClick={handleDownloadCopy}>
                <Copy className="ml-2 h-5 w-5" />
                تنزيل نسخة من الملف
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
