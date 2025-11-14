'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ImageFile = {
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
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    const removedImage = newImages.splice(index, 1)[0];
    URL.revokeObjectURL(removedImage.preview); // Clean up memory
    setSelectedImages(newImages);
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
      // In a real app, you'd send images to a server or use a wasm library
      // For now, we simulate a delay and don't actually generate a PDF
      // to keep it client-side and simple for this step.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // The actual PDF generation will be added in the next step.
      // For now, we'll just show a success message.
      toast({
        title: 'قيد التطوير',
        description: 'سيتم تنفيذ وظيفة تحويل PDF الفعلية قريبًا.',
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

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">تحويل الصور إلى PDF</h1>
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
                يمكنك اختيار عدة صور في وقت واحد.
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
                <CardTitle>الصور المختارة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group aspect-square">
                    <Image
                      src={image.preview}
                      alt={`Selected ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeImage(index)}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row items-center gap-4 border-t pt-6">
                <div className="flex-1 w-full">
                  <Input
                    placeholder="أدخل اسم الملف (اختياري)..."
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

          {isConverting && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>جاري التحويل إلى PDF...</AlertTitle>
              <AlertDescription>
                يرجى الانتظار، قد يستغرق هذا بعض الوقت.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
