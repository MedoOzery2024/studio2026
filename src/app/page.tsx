import { Clock } from "@/components/clock";
import { DateDisplay } from "@/components/date-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileImage, Mic, ArrowRight, FileQuestion, Brain, AudioLines, BarChart3, Presentation } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 md:p-8">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-small-white/[0.2] -z-10"></div>
      <div className="container mx-auto max-w-4xl">
        <div
          className="text-center space-y-4 mb-12 animate-fade-in-down"
        >
          <div className="inline-block p-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70 rounded-lg">
             <div className="bg-background rounded-md p-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary"><path d="M15 2H6v20h12z"/><path d="M11 1V8h6z" fill="hsl(var(--primary))"/><path d="M11 1V8h6"/><path d="M7 7h4"/><path d="M7 11h8"/><path d="M7 15h4"/></svg>
             </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70 tracking-tighter leading-none">
            Mahmoud.AI
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto break-words">
            Mahmoud Mohamed Mahmoud Abo Elfetouh Ahmed El Ozairy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Clock />
            <DateDisplay />
          </div>
          <FeatureCard
            href="/expert-assistant"
            title="مساعد الخبراء بالذكاء الاصطناعي"
            description="طرح الأسئلة، والحصول على شروح، وتوليد الأفكار."
            icon={<BrainCircuit className="size-8 text-primary/80" />}
          />
          <FeatureCard
            href="/image-to-pdf"
            title="تحويل الصور إلى PDF"
            description="تحويل الصور إلى ملفات PDF وتلخيصها."
            icon={<FileImage className="size-8 text-primary/80" />}
          />
           <FeatureCard
            href="/speech-to-text"
            title="تحويل الكلام إلى نص"
            description="تسجيل الصوت وتحويله إلى نص مكتوب."
            icon={<Mic className="size-8 text-primary/80" />}
          />
           <FeatureCard
            href="/question-generator"
            title="مولد الأسئلة"
            description="إنشاء أسئلة تفاعلية وثابتة من الصور وملفات PDF."
            icon={<FileQuestion className="size-8 text-primary/80" />}
          />
          <FeatureCard
            href="/mind-map-generator"
            title="صانع الخرائط الذهنية"
            description="إنشاء خرائط ذهنية من الصور وملفات PDF."
            icon={<Brain className="size-8 text-primary/80" />}
          />
           <FeatureCard
            href="/text-to-speech"
            title="تحويل النص إلى كلام"
            description="تحويل محتوى المستندات إلى ملفات صوتية مسموعة."
            icon={<AudioLines className="size-8 text-primary/80" />}
          />
          <FeatureCard
            href="/chart-analyzer"
            title="محلل الرسومات البيانية"
            description="تحليل الرسوم البيانية واستخراج البيانات في جداول."
            icon={<BarChart3 className="size-8 text-primary/80" />}
          />
          <FeatureCard
            href="/content-to-ppt"
            title="تحويل المحتوى إلى PowerPoint"
            description="إنشاء عرض تقديمي من محتوى الصور وملفات PDF."
            icon={<Presentation className="size-8 text-primary/80" />}
          />
        </div>
      </div>
    </main>
  );
}

type FeatureCardProps = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function FeatureCard({ href, title, description, icon }: FeatureCardProps) {
  return (
     <Link href={href} className="group">
      <Card className="h-full bg-white/5 border-white/10 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20">
        <CardHeader>
          {icon}
          <CardTitle className="text-lg font-bold text-foreground/90 mt-4">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
        <div className="p-6 pt-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary/90 group-hover:text-primary transition-colors">
            <span>ابدأ الآن</span>
            <ArrowRight className="size-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
