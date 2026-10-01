import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, Mic, Volume2, Trash2, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Prism from '@/components/Prism';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message as ChatMessage,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/author-chat`;

const AuthorChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    const allMessages = [...messages, userMessage];
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: allMessages.map(m => ({ role: m.role, content: m.content }))
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("فشل الاتصال بالمؤلف");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantSoFar;
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(userMessage);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup audio analyzer for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Animate audio level
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "خطأ",
        description: "لا يمكن الوصول إلى الميكروفون",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    
    const stream = mediaRecorderRef.current?.stream;
    stream?.getTracks().forEach(t => t.stop());
    
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingDuration(0);
    setAudioLevel(0);
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    // Chunked encoding to avoid "Maximum call stack size" / memory issues
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = arrayBufferToBase64(arrayBuffer);

      const transcribeResp = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio },
      });

      if (transcribeResp.error) {
        throw new Error(transcribeResp.error.message);
      }

      if (transcribeResp.data?.text) {
        setAudioBlob(null);
        setRecordingDuration(0);
        setIsTranscribing(false);
        await sendMessage(transcribeResp.data.text);
      } else {
        throw new Error('لم يتم التعرف على الكلام');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "خطأ في التحويل",
        description: error instanceof Error ? error.message : "فشل تحويل الصوت إلى نص",
        variant: "destructive",
      });
      setIsTranscribing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative flex h-screen min-h-[36rem] overflow-hidden bg-background" dir="rtl">
      <div className="absolute inset-0 opacity-55 pointer-events-none" aria-hidden="true">
        <Prism animationType="rotate" timeScale={0.5} height={3.5} baseWidth={5.5} scale={3.6} hueShift={0} colorFrequency={1} noise={0} glow={1} suspendWhenOffscreen />
      </div>
      <div className="absolute inset-0 bg-background/72 backdrop-blur-sm pointer-events-none" />

      <main className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col border-x border-border/70 bg-background/78 shadow-2xl backdrop-blur-xl">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 px-3 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="العودة إلى المكتبة">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <img src="/qahwa-library-logo.jpg" alt="QAHWA LIBRARY" className="h-10 w-10 rounded-md object-cover" />
          <div className="min-w-0">
            <h1 className="truncate font-bold text-foreground">المؤلف أحمد سالم</h1>
            <p className="truncate text-xs text-muted-foreground">أديب ومثقف موريتاني · متصل بالمكتبة</p>
          </div>
        </header>

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto w-full max-w-4xl gap-5 px-4 py-8 sm:px-8">
            {messages.length === 0 ? (
              <ConversationEmptyState className="min-h-[50vh]">
                <img src="/qahwa-library-logo.jpg" alt="QAHWA LIBRARY" className="h-24 w-24 rounded-lg object-cover shadow-xl" />
                <h2 className="mt-3 text-2xl font-bold text-foreground">مرحباً بك في محادثتي</h2>
                <p className="max-w-xl text-muted-foreground">أنا المؤلف أحمد سالم. اسألني عن الكتب والأدب أو اطلب مني اقتراح كتاب من مكتبة القهوة.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['ما هي أفضل الكتب للمبتدئين؟', 'أوصني بكتاب في الأدب العربي', 'حدثني عن الأدب الموريتاني'].map((q) => (
                    <Button key={q} variant="secondary" size="sm" onClick={() => setInput(q)}>{q}</Button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : messages.map((msg, i) => (
              <ChatMessage key={`${msg.role}-${i}`} from={msg.role}>
                <MessageContent className={msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>
                  {msg.role === 'assistant' ? <MessageResponse>{msg.content}</MessageResponse> : <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                </MessageContent>
                {msg.role === 'assistant' && (
                  <MessageActions>
                    <MessageAction tooltip="استمع" onClick={() => speakText(msg.content)} disabled={isSpeaking}>
                      <Volume2 className="h-4 w-4" />
                    </MessageAction>
                  </MessageActions>
                )}
              </ChatMessage>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <ChatMessage from="assistant"><MessageContent><Shimmer>يفكر أحمد سالم...</Shimmer></MessageContent></ChatMessage>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t border-border/70 bg-background/88 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6">
          {(isRecording || audioBlob) && (
            <div className="mx-auto mb-2 flex max-w-4xl items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-2">
              <Mic className="h-4 w-4 text-destructive" />
              <span className="font-mono text-sm">{formatDuration(recordingDuration)}</span>
              <span className="min-w-0 flex-1 text-sm text-muted-foreground">{isRecording ? 'جاري التسجيل...' : 'التسجيل جاهز للإرسال'}</span>
              <Button variant="ghost" size="icon" onClick={cancelRecording} aria-label="حذف التسجيل"><Trash2 className="h-4 w-4" /></Button>
              {isRecording ? (
                <Button variant="destructive" size="icon" onClick={stopRecording} aria-label="إيقاف التسجيل"><Square className="h-4 w-4" /></Button>
              ) : (
                <Button size="sm" onClick={sendVoiceMessage} disabled={isTranscribing}>{isTranscribing ? <Loader2 className="animate-spin" /> : 'إرسال الصوت'}</Button>
              )}
            </div>
          )}
          <PromptInput
            className="mx-auto max-w-4xl"
            onSubmit={({ text }) => sendMessage(text)}
          >
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              disabled={isLoading || isRecording || !!audioBlob}
              className="min-h-16 text-base"
            />
            <PromptInputFooter>
              <PromptInputTools>
                {!audioBlob && (
                  <PromptInputButton
                    tooltip={isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading}
                  >
                    {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </PromptInputButton>
                )}
              </PromptInputTools>
              <PromptInputSubmit
                status={isLoading ? 'streaming' : 'ready'}
                disabled={!input.trim() || isRecording || !!audioBlob}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </main>
    </div>
  );
};

export default AuthorChat;
