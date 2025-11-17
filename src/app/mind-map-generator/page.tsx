'use client';

import { useState, useRef, Fragment, WheelEvent, MouseEvent } from 'react';
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
import { Upload, FileUp, BrainCircuit, Loader2, AlertCircle, Download, File, Share2, CornerDownLeft, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateMindMap, GenerateMindMapInput, MindMapNode } from '@/ai/flows/mind-map-generator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';

// Recursive component to render the mind map
const MindMapNodeComponent = ({ node, level }: { node: MindMapNode, level: number }) => {
  if (!node) {
    return null; // Add a guard clause to prevent rendering if the node is null
  }
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

  // Zoom/Pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const mindMapContainerRef = useRef<HTMLDivElement>(null);


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
    resetZoomAndPan();

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

   const addNodeToPdf = (doc: jsPDF, node: MindMapNode, level: number, y: { current: number }) => {
    if (!node) return;
    const x = 15 + level * 10;
    const textLines = doc.splitTextToSize(`- ${node.title}: ${node.details}`, 180 - x);
    
    if (y.current + textLines.length * 5 > 280) { // Check if new page is needed
      doc.addPage();
      y.current = 20;
    }

    doc.text(textLines, x, y.current, { lang: 'ar' });
    y.current += textLines.length * 5 + 2;

    if (node.subIdeas) {
      node.subIdeas.forEach(subNode => {
        addNodeToPdf(doc, subNode, level + 1, y);
      });
    }
  };

  const exportToPdf = () => {
    if (!generatedMindMap) return;

    const doc = new jsPDF();
    doc.addFont('Cairo', 'Cairo', 'normal');
    doc.setFont('Cairo');
    
    doc.setR2L(true);

    let y = { current: 20 };

    doc.setFontSize(22);
    doc.text(generatedMindMap.title, 105, y.current, { align: 'center' });
    y.current += 10;

    doc.setFontSize(12);
    addNodeToPdf(doc, generatedMindMap, 0, y);
    
    doc.save(`${fileName.split('.')[0] || 'mindmap'}.pdf`);
  };

  const addSlideContent = (pptx: PptxGenJS, node: MindMapNode, level: number) => {
    const slide = pptx.addSlide();
    // Slide Title
    slide.addText(node.title, {
      x: 0.5, y: 0.5, w: '90%', h: 0.75, 
      align: 'right', fontSize: 24, bold: true, fontFace: 'Cairo'
    });

    // Slide Details
    slide.addText(node.details, {
      x: 0.5, y: 1.5, w: '90%', h: 2, 
      align: 'right', fontSize: 16, fontFace: 'Cairo'
    });

    // Sub-ideas
    if (node.subIdeas && node.subIdeas.length > 0) {
      const subIdeaPoints = node.subIdeas.map(subNode => ({
        text: subNode.title,
        options: {
          fontSize: 14,
          bullet: true,
          fontFace: 'Cairo'
        }
      }));
      slide.addText(subIdeaPoints, {
        x: 1.0, y: 3.5, w: '85%', h: 2,
        align: 'right'
      });
    }

    // Recursively add slides for sub-ideas
    if (node.subIdeas) {
      node.subIdeas.forEach(subNode => {
        if(subNode) { // Guard against null sub-nodes
          addSlideContent(pptx, subNode, level + 1);
        }
      });
    }
  };
  
  const exportToPptx = () => {
    if (!generatedMindMap) return;
    const pptx = new PptxGenJS();
    pptx.rtl = true;

    // Create a title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(generatedMindMap.title, {
        x: 0, y: 0, w: "100%", h: "100%",
        align: 'center', valign: 'middle',
        fontSize: 32, bold: true, fontFace: 'Cairo'
    });
    titleSlide.addText('تم إنشاؤه بواسطة Mahmoud.AI', {
        x: 0, y: 4.5, w: "100%", h: 0.5,
        align: 'center', fontSize: 14, color: '888888', fontFace: 'Cairo'
    });
    
    // Create content slides
    if (generatedMindMap.subIdeas) {
      generatedMindMap.subIdeas.forEach(idea => {
        if (idea) { // Guard against null ideas
          addSlideContent(pptx, idea, 0);
        }
      });
    }

    pptx.writeFile({ fileName: `${fileName.split('.')[0] || 'mindmap'}.pptx` });
  };
  
  // Pan and Zoom handlers
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prevScale => Math.min(Math.max(prevScale * scaleAmount, 0.2), 3));
  };
  
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y
    });
  };
  
  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const resetZoomAndPan = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
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
                    <CardDescription>استخدم عجلة الماوس للتكبير والسحب للتحريك.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 border-t pt-6'>
                    <div 
                      ref={mindMapContainerRef}
                      className='relative h-[500px] w-full overflow-auto rounded-lg border bg-muted/20 cursor-grab'
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUpOrLeave}
                      onMouseLeave={handleMouseUpOrLeave}
                    >
                       <div 
                         style={{ 
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: '0 0'
                         }}
                         className="p-4 min-w-full min-h-full"
                       >
                          <MindMapNodeComponent node={generatedMindMap} level={0} />
                       </div>
                    </div>
                     <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(s * 1.2, 3))}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(s * 0.8, 0.2))}>
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                         <Button variant="outline" size="icon" onClick={resetZoomAndPan}>
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button variant="outline" onClick={exportToPdf} disabled={!generatedMindMap}>
                    <Download className="ml-2 h-4 w-4" />
                    تصدير كـ PDF
                  </Button>
                  <Button variant="outline" onClick={exportToPptx} disabled={!generatedMindMap}>
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

    
