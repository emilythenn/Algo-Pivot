import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Loader2, Radio } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/integrations/supabase/client";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const langToSpeech: Record<string, string> = {
  en: "en-US",
  ms: "ms-MY",
  zh: "zh-CN",
  ta: "ta-IN",
};

const placeholderByLang: Record<string, string> = {
  en: "Tap mic & ask: \"What should I plant?\"",
  ms: "Tekan mic & tanya: \"Apa patut saya tanam?\"",
  zh: "点击麦克风问：\"我应该种什么？\"",
  ta: "மைக்கை அழுத்தி கேளுங்கள்",
};

const statusByLang: Record<string, Record<VoiceState, string>> = {
  en: { idle: "Ready", listening: "Listening...", processing: "Thinking...", speaking: "Speaking..." },
  ms: { idle: "Sedia", listening: "Mendengar...", processing: "Berfikir...", speaking: "Bercakap..." },
  zh: { idle: "准备好了", listening: "聆听中...", processing: "思考中...", speaking: "回答中..." },
  ta: { idle: "தயார்", listening: "கேட்கிறது...", processing: "சிந்திக்கிறது...", speaking: "பேசுகிறது..." },
};

export function VoiceAssistant() {
  const { language, t } = useSettings();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, reply]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langToSpeech[language] || "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    synthRef.current = utterance;
    setState("speaking");
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const processQuery = useCallback(async (query: string) => {
    setState("processing");
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("voice-assistant", {
        body: { query, language },
      });
      if (fnError) throw new Error(fnError.message);
      const response = data?.reply || "Sorry, no response.";
      setReply(response);
      setHistory((prev) => [...prev, { q: query, a: response }]);
      speak(response);
    } catch (e: any) {
      const msg = e.message || "Failed to get response";
      setError(msg);
      setState("idle");
    }
  }, [language, speak]);

  const startListening = useCallback(() => {
    setError("");
    setTranscript("");
    setReply("");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langToSpeech[language] || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      const currentTranscript = document.getElementById("voice-transcript")?.textContent || "";
      if (currentTranscript.trim()) {
        processQuery(currentTranscript.trim());
      } else {
        setState("idle");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        setError(language === "ms" ? "Tiada pertuturan dikesan" : "No speech detected");
      } else if (event.error === "not-allowed") {
        setError(language === "ms" ? "Sila benarkan akses mikrofon" : "Please allow microphone access");
      } else {
        setError(`Error: ${event.error}`);
      }
      setState("idle");
    };

    recognitionRef.current = recognition;
    setState("listening");
    recognition.start();
  }, [language, processQuery]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState("idle");
  }, []);

  const handleClose = () => {
    stopListening();
    stopSpeaking();
    setOpen(false);
    setState("idle");
    setTranscript("");
    setReply("");
    setError("");
  };

  const stateColor = {
    idle: "bg-primary",
    listening: "bg-red-500",
    processing: "bg-amber-500",
    speaking: "bg-emerald-500",
  };

  const pulseColor = {
    idle: "",
    listening: "shadow-red-500/40",
    processing: "shadow-amber-500/30",
    speaking: "shadow-emerald-500/30",
  };

  return (
    <>
      {/* Voice FAB - positioned above chat FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-shadow"
            title="Voice Assistant"
          >
            <Mic className="h-6 w-6 text-white" strokeWidth={1.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[380px] flex flex-col glass-panel overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Voice Assistant</p>
                  <p className="text-[10px] text-muted-foreground">Offline-Ready • Multi-Language</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </div>

            {/* Conversation History */}
            <div ref={scrollRef} className="flex-1 max-h-[280px] overflow-y-auto px-4 py-3 space-y-3">
              {history.length === 0 && !transcript && !reply && (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-600/10 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[260px]">
                    {placeholderByLang[language] || placeholderByLang.en}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                    {[
                      language === "ms" ? "Cuaca minggu ini?" : "Weather this week?",
                      language === "ms" ? "Tanam apa bagus?" : "What to plant?",
                      language === "ms" ? "Harga getah?" : "Rubber price?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setTranscript(q); processQuery(q); }}
                        className="text-[11px] px-2.5 py-1.5 rounded-full bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {history.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-end">
                    <div className="bg-accent/10 rounded-xl rounded-br-sm px-3 py-2 text-xs max-w-[85%]">
                      {item.q}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-emerald-600/10 rounded-xl rounded-bl-sm px-3 py-2 text-xs max-w-[85%] text-foreground">
                      {item.a}
                    </div>
                  </div>
                </div>
              ))}

              {/* Live transcript */}
              {transcript && state === "listening" && (
                <div className="flex justify-end">
                  <div className="bg-accent/10 rounded-xl px-3 py-2 text-xs max-w-[85%] italic text-muted-foreground">
                    <span id="voice-transcript">{transcript}</span>
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {state === "processing" && (
                <div className="flex justify-start">
                  <div className="bg-emerald-600/10 rounded-xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  </div>
                </div>
              )}

              {/* Current reply being spoken */}
              {reply && state === "speaking" && (
                <div className="flex justify-start">
                  <div className="bg-emerald-600/10 rounded-xl rounded-bl-sm px-3 py-2 text-xs max-w-[85%] flex items-start gap-2">
                    <Volume2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse" />
                    <span>{reply}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center">
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 inline-block">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Mic Button Area */}
            <div className="px-4 py-4 border-t border-border/30 flex flex-col items-center gap-2">
              <p className="text-[11px] text-muted-foreground font-medium">
                {(statusByLang[language] || statusByLang.en)[state]}
              </p>
              <button
                onClick={() => {
                  if (state === "listening") stopListening();
                  else if (state === "speaking") stopSpeaking();
                  else if (state === "idle") startListening();
                }}
                disabled={state === "processing"}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${stateColor[state]} ${
                  state === "listening" ? `shadow-[0_0_30px_8px] ${pulseColor[state]} animate-pulse` : 
                  state === "speaking" ? `shadow-[0_0_20px_4px] ${pulseColor[state]}` :
                  "shadow-lg"
                } disabled:opacity-40`}
              >
                {state === "listening" ? (
                  <MicOff className="h-7 w-7 text-white" strokeWidth={1.5} />
                ) : state === "processing" ? (
                  <Loader2 className="h-7 w-7 text-white animate-spin" strokeWidth={1.5} />
                ) : state === "speaking" ? (
                  <Volume2 className="h-7 w-7 text-white" strokeWidth={1.5} />
                ) : (
                  <Mic className="h-7 w-7 text-white" strokeWidth={1.5} />
                )}
              </button>
              <p className="text-[10px] text-muted-foreground/60">
                {language === "ms" ? "Tekan untuk bercakap" : "Tap to speak"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
