'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Upload,
  FileImage,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  CornerDownLeft,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import jsPDF from 'jspdf';

type ImageFile = {
  id: number;
  file: File;
  preview: string;
};

export default function ImageToPdfPage() {
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [fileName, setFileName] = useState('converted-file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const imageFiles = files
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({
          id: Date.now() + Math.random(),
          file,
          preview: URL.createObjectURL(file),
        }));

      if (imageFiles.length !== files.length) {
        toast({
          variant: 'destructive',
          title: 'ملفات غير صالحة',
          description: 'تم اختيار بعض الملفات التي ليست صورًا.',
        });
      }

      setSelectedImages((prev) => [...prev, ...imageFiles]);
      setPdfUrl(null);
    }
  };

  const removeImage = (id: number) => {
    const newImages = selectedImages.filter(image => image.id !== id);
    const removedImage = selectedImages.find(image => image.id === id);
    if(removedImage) {
        URL.revokeObjectURL(removedImage.preview); // Clean up memory
    }
    setSelectedImages(newImages);
    if (newImages.length === 0) {
      setPdfUrl(null);
    }
  };
  
  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...selectedImages];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if(targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setSelectedImages(newImages);
  };

  const readImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertToPdf = async () => {
    if (selectedImages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'لا توجد صور',
        description: 'الرجاء اختيار صورة واحدة على الأقل للتحويل.',
      });
      return;
    }

    setIsConverting(true);
    setPdfUrl(null);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const imageDataUrl = await readImageFile(image.file);
        
        const img = document.createElement('img');
        img.src = imageDataUrl;
        await new Promise(resolve => { img.onload = resolve; });

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;

        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imageDataUrl, 'JPEG', x, y, finalWidth, finalHeight);
      }
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      toast({
        title: 'تم التحويل بنجاح!',
        description: 'ملف PDF الخاص بك جاهز للتنزيل.',
      });

    } catch (error) {
      console.error('Error converting to PDF:', error);
      toast({
        variant: 'destructive',
        title: 'فشل التحويل',
        description: 'حدث خطأ أثناء تحويل الصور إلى PDF.',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${fileName.trim() || 'converted-file'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">تحويل الصور إلى PDF</h1>
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
                انقر أو اسحب الصور هنا
              </p>
              <p className="text-sm text-muted-foreground">
                يمكنك اختيار عدة صور وإعادة ترتيبها.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </CardContent>
          </Card>

          {selectedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الصور المختارة ({selectedImages.length})</CardTitle>
                <CardDescription>يمكنك إعادة ترتيب الصور قبل التحويل.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedImages.map((image, index) => (
                  <div key={image.id} className="relative group aspect-square">
                    <Image
                      src={image.preview}
                      alt={`Selected ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                     <div className="absolute top-1 right-1 text-white bg-black/50 rounded-full h-6 w-6 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                     </div>
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeImage(image.id)}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                      <div className='flex gap-1'>
                        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => moveImage(index, 'left')} disabled={index === 0}>
                            <ArrowRight className='h-5 w-5'/>
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => moveImage(index, 'right')} disabled={index === selectedImages.length - 1}>
                            <ArrowLeft className='h-5 w-5'/>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row items-center gap-4 border-t pt-6">
                <div className="flex-1 w-full">
                  <Input
                    placeholder="أدخل اسم الملف..."
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Button
                  onClick={convertToPdf}
                  disabled={isConverting}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isConverting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileImage className="mr-2 h-4 w-4" />
                  )}
                  {isConverting ? 'جاري التحويل...' : `تحويل (${selectedImages.length}) صور`}
                </Button>
              </CardFooter>
            </Card>
          )}

          {pdfUrl && !isConverting && (
             <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>ملف PDF جاهز!</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>يمكنك الآن تنزيل ملفك.</span>
                 <Button onClick={handleDownload} size="sm">
                  <Download className="ml-2 h-4 w-4" />
                  تنزيل
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
