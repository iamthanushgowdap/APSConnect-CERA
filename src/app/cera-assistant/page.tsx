// Cera.Ai - Education Assistant Page
import { CeraAssistant } from '@/components/cera-assistant';

export default function CeraAssistantPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Cera.Ai Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Your intelligent education assistant powered by Gemini AI. Ask questions about timetables, attendance, subjects, and more.
          </p>
        </div>

        <CeraAssistant />
      </div>
    </div>
  );
}
