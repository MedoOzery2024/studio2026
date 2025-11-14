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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileUp, BarChart3, Loader2, AlertCircle, Download, FileText, CornerDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { analyzeChart, AnalyzeChartInput, AnalyzeChartOutput } from '@/ai/flows/chart-analyzer';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { font } from './font'; // Import the font
import PptxGenJS from 'pptxgenjs';


// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export default function ChartAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeChartOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setAnalysisResult(null);
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

  const handleAnalyzeClick = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'لم يتم اختيار ملف',
        description: 'الرجاء تحميل صورة أو ملف PDF يحتوي على رسم بياني أولاً.',
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

     try {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const input: AnalyzeChartInput = { fileDataUri: base64Data };
          
          const result = await analyzeChart(input);

          if (result) {
            setAnalysisResult(result);
            toast({
              title: 'تم تحليل الرسم البياني بنجاح!',
              description: 'يمكنك الآن استعراض البيانات وتصديرها.',
            });
          } else {
             setError('لم يتمكن الذكاء الاصطناعي من تحليل الرسم البياني. حاول مرة أخرى بملف مختلف.');
          }
       }
       reader.onerror = () => {
         throw new Error('فشل في قراءة الملف.');
       }
    } catch(e: any) {
        console.error("Error analyzing chart:", e);
        setError(e.message || 'حدث خطأ غير متوقع أثناء تحليل الرسم البياني.');
        toast({
            variant: 'destructive',
            title: 'فشل التحليل',
            description: 'حدث خطأ أثناء التواصل مع الذكاء الاصطناعي.',
        });
    } finally {
        setIsAnalyzing(false);
    }
  };
  
    const handleExportToPDF = () => {
    if (!analysisResult) return;

    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Add the custom font
    doc.addFileToVFS('Cairo-Regular-normal.ttf', font);
    doc.addFont('Cairo-Regular-normal.ttf', 'Cairo-Regular', 'normal');
    doc.setFont('Cairo-Regular');
    
    // jsPDF does not handle RTL text wrapping well, so we split it manually
    const wrapText = (text: string, maxWidth: number) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        // Reverse lines for RTL display
        return lines.reverse();
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.text(analysisResult.title, pageWidth / 2, y, { align: 'center', lang: 'ar' });
    y += 15;
    
    // Summary
    doc.setFontSize(16);
    doc.text("ملخص التحليل", pageWidth - margin, y, { align: 'right', lang: 'ar' });
    y += 8;
    
    doc.setFontSize(12);
    const summaryLines = wrapText(analysisResult.summary, contentWidth);
    doc.text(summaryLines, pageWidth - margin, y, { align: 'right', lang: 'ar' });
    y += summaryLines.length * 7 + 10;

    // Table
    doc.setFontSize(16);
    doc.text("جدول البيانات", pageWidth - margin, y, { align: 'right', lang: 'ar' });
    y += 10;
    
    doc.autoTable({
        startY: y,
        head: [analysisResult.table.headers.map(h => h).reverse()],
        body: analysisResult.table.rows.map(row => [...row].reverse()),
        theme: 'grid',
        styles: {
            font: 'Cairo-Regular',
            halign: 'right',
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
        },
    });

    doc.save(`${fileName.split('.')[0]}_analysis.pdf`);
  };

  const handleExportToPPTX = () => {
    if (!analysisResult) return;

    const pptx = new PptxGenJS();
    pptx.rtl = true;

    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(analysisResult.title, { 
        x: 0, y: 1, w: '100%', h: 1.5, 
        align: 'center', fontSize: 32, bold: true, color: '363636' 
    });
    titleSlide.addText('تحليل بواسطة Mahmoud.AI', {
        x: 0, y: 4, w: '100%', h: 1,
        align: 'center', fontSize: 18, color: '7F7F7F'
    });

    // Summary Slide
    const summarySlide = pptx.addSlide();
    summarySlide.addText('ملخص التحليل', { 
        x: 0.5, y: 0.25, w: '90%', h: 0.75, 
        align: 'right', fontSize: 24, bold: true, color: '363636' 
    });
    summarySlide.addText(analysisResult.summary, {
        x: 0.5, y: 1.1, w: '90%', h: 4,
        align: 'right', fontSize: 16, color: '494949',
    });

    // Table Slide
    const tableSlide = pptx.addSlide();
    tableSlide.addText('جدول البيانات', { 
        x: 0.5, y: 0.25, w: '90%', h: 0.75, 
        align: 'right', fontSize: 24, bold: true, color: '363636' 
    });
    
    // pptxgenjs tables do not directly support RTL text in the same way, we can align text right
    const tableHeaders = analysisResult.table.headers.map(header => ({ text: header, options: { bold: true } }));
    const tableRows = analysisResult.table.rows;

    tableSlide.addTable(tableRows, {
        x: 0.5, y: 1.1, w: '90%',
        head: tableHeaders,
        rowH: 0.5,
        colW: Array(analysisResult.table.headers.length).fill(9 / analysisResult.table.headers.length),
        border: { type: 'solid', pt: 1, color: 'D9D9D9' },
        align: 'right',
        valign: 'middle',
        headAlign: 'right',
        fontSize: 12,
        autoPage: true,
    });
    
    pptx.writeFile({ fileName: `${fileName.split('.')[0]}_analysis.pptx` });

  };

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-bold text-primary">محلل الرسومات البيانية</h1>
         <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
          <CornerDownLeft className="h-5 w-5" />
          <span className="sr-only">العودة</span>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <Card
            className="border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors"
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center p-12 text-center cursor-pointer">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold">
                انقر أو اسحب صورة أو ملف PDF هنا
              </p>
              <p className="text-sm text-muted-foreground">
                سيتم تحليل الرسم البياني الموجود في الملف.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isAnalyzing}
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
                <CardTitle>تحليل الرسم البياني</CardTitle>
                <CardDescription>
                  اضغط على الزر أدناه لبدء تحليل الرسم البياني من المحتوى الذي تم تحميله.
                </CardDescription>
             </CardHeader>
            <CardFooter>
               <Button size="lg" disabled={!file || isAnalyzing} onClick={handleAnalyzeClick}>
                {isAnalyzing ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <BarChart3 className="ml-2 h-5 w-5" />}
                {isAnalyzing ? 'جاري تحليل الرسم البياني...' : 'ابدأ التحليل'}
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

          {isAnalyzing && (
             <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-lg">يقوم الذكاء الاصطناعي بتحليل الرسم البياني واستخراج البيانات...</p>
                  </div>
                </CardContent>
            </Card>
          )}

          {analysisResult && !isAnalyzing && (
            <Card>
                <CardHeader>
                    <CardTitle>{analysisResult.title}</CardTitle>
                    <CardDescription>هذه هي البيانات المستخرجة من الرسم البياني.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6 border-t pt-6'>
                    <div className='space-y-3'>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                           <FileText className='size-5 text-primary'/>
                           ملخص التحليل
                        </h3>
                        <p className='text-muted-foreground'>{analysisResult.summary}</p>
                    </div>
                     <div className='space-y-3'>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Table className='size-5 text-primary'/>
                            جدول البيانات
                        </h3>
                         <div className='border rounded-lg overflow-hidden'>
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         {analysisResult.table.headers.map((header, index) => (
                                             <TableHead key={index}>{header}</TableHead>
                                         ))}
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {analysisResult.table.rows.map((row, rowIndex) => (
                                         <TableRow key={rowIndex}>
                                             {row.map((cell, cellIndex) => (
                                                 <TableCell key={cellIndex}>{cell}</TableCell>
                                             ))}
                                         </TableRow>
                                     ))}
                                 </TableBody>
                             </Table>
                         </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={handleExportToPDF} disabled={!analysisResult}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير كـ PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportToPPTX} disabled={!analysisResult}>
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
