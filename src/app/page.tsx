import { Clock } from "@/components/clock";
import { DateDisplay } from "@/components/date-display";

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
        </div>
      </div>
    </main>
  );
}
