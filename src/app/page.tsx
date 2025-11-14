import { Clock } from "@/components/clock";
import { DateDisplay } from "@/components/date-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileImage, Mic } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 transition-colors duration-500">
      <div className="container mx-auto max-w-3xl">
        <div
          className="text-center space-y-2 mb-10 animate-fade-in-down"
        >
          <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tighter">
            Mahmoud.AI
          </h1>
          <p className="text-base md:text-lg text-muted-foreground/80 max-w-xl mx-auto break-words">
            Mahmoud Mohamed Mahmoud Abo Elfetouh Ahmed El Ozairy
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in"
          style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
        >
          <Clock />
          <DateDisplay />
          <Link href="/expert-assistant" className="sm:col-span-2">
            <Card className="hover:border-primary/80 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  مساعد الخبراء بالذكاء الاصطناعي
                </CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">Mahmoud.AI Expert Assistant</p>
                <p className="text-sm text-muted-foreground">
                  طرح الأسئلة، والحصول على شروح، وتوليد الأفكار.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/image-to-pdf" className="sm:col-span-2">
            <Card className="hover:border-primary/80 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  تحويل الصور إلى PDF
                </CardTitle>
                <FileImage className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">Image to PDF Converter</p>
                <p className="text-sm text-muted-foreground">
                  تحويل الصور إلى ملفات PDF وتلخيصها باستخدام الذكاء
                  الاصطناعي.
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/speech-to-text" className="sm:col-span-2">
            <Card className="hover:border-primary/80 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  تحويل الكلام إلى نص
                </CardTitle>
                <Mic className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">Speech to Text Converter</p>
                <p className="text-sm text-muted-foreground">
                  تسجيل الصوت من الميكروفون وتحويله إلى نص مكتوب.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
