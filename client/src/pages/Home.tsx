import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Languages, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Key,
  Globe
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  callLLM, 
  MODELS, 
  LANGUAGES, 
  getTranslationPrompt, 
  getCritiquePrompt 
} from "@/lib/mentorpiece";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [targetLang, setTargetLang] = useState("English");
  const [translation, setTranslation] = useState("");
  const [critique, setCritique] = useState("");
  const { toast } = useToast();

  const processRequest = useMutation({
    mutationFn: async () => {
      if (!inputText.trim()) throw new Error("Please enter some text to translate.");

      // Step 1: Translate
      const translatePrompt = getTranslationPrompt(inputText, targetLang);
      const translatedText = await callLLM(MODELS.TRANSLATE, translatePrompt);
      setTranslation(translatedText);

      // Step 2: Critique
      const critiquePrompt = getCritiquePrompt(inputText, translatedText);
      const critiqueText = await callLLM(MODELS.CRITIQUE, critiquePrompt);
      setCritique(critiqueText);

      return { translatedText, critiqueText };
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 font-sans text-foreground selection:bg-primary/10 selection:text-primary">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/40 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-primary">
              AI Translator & Critic
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md">
              Professional translation powered by Qwen, with academic critique by Claude 3.5 Sonnet.
            </p>
          </div>
        </header>

        {/* Main Interface */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Input Column */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Source Text
              </label>
              <Textarea 
                placeholder="Enter text to translate..." 
                className="min-h-[300px] p-6 text-lg leading-relaxed resize-none border-border shadow-sm focus:border-primary/30 focus:ring-primary/10 transition-all font-serif bg-card/50"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
              <div className="flex-1 w-full">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Language</label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-full border-border/60 bg-background">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                size="lg" 
                className="w-full sm:w-auto h-12 px-8 font-medium text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={() => processRequest.mutate()}
                disabled={processRequest.isPending}
              >
                {processRequest.isPending ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    Translate & Critique <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Output Column */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {translation && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Translation
                  </label>
                  <Card className="border-border/60 shadow-md bg-white overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                      <p className="text-lg md:text-xl leading-relaxed font-serif text-foreground">
                        {translation}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {critique && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="space-y-4"
                >
                  <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-4 h-4" /> AI Critique
                  </label>
                  <Card className="border-primary/20 shadow-lg shadow-primary/5 bg-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Sparkles className="w-24 h-24 text-primary" />
                    </div>
                    <CardHeader className="pb-2 border-b border-primary/10">
                      <CardTitle className="text-sm font-medium text-primary tracking-wide">
                        EVALUATION REPORT
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      <div className="prose prose-sm prose-p:text-foreground/80 prose-headings:text-foreground max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed bg-transparent p-0 m-0 border-0 text-foreground/90">
                          {critique}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {!translation && !processRequest.isPending && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 space-y-4 min-h-[400px] border-2 border-dashed border-border/50 rounded-2xl">
                <BookOpen className="w-12 h-12" />
                <p className="font-medium">Ready to translate</p>
              </div>
            )}

            {processRequest.isPending && !translation && (
               <div className="h-full flex flex-col items-center justify-center space-y-6 min-h-[400px]">
                 <div className="relative">
                   <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                   </div>
                 </div>
                 <p className="text-muted-foreground animate-pulse font-medium">Processing your text...</p>
               </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
