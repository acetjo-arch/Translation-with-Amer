import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Mic, Square, RefreshCw, Languages, Loader2, Volume2, ArrowLeft, Award, GraduationCap, Phone, MapPin, Globe, BookOpen } from 'lucide-react';

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<{ transcription: string; translation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    setError(null);
    setResult(null);
    setAudioUrl(null);
    setAudioBlob(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("يرجى السماح بالوصول إلى الميكروفون للتسجيل.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const translateAudio = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    setError(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
            { text: `You are a professional academic translator. Transcribe the Arabic audio exactly, then translate it into professional academic English.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcription: { type: Type.STRING },
              translation: { type: Type.STRING }
            },
            required: ["transcription", "translation"]
          }
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        setResult(JSON.parse(jsonText));
      }
    } catch (err) {
      console.error("Translation error:", err);
      setError("حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white"><Globe className="w-6 h-6" /></div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-none">المترجم الأكاديمي</h1>
                <p className="text-xs text-slate-500 mt-1">Academic Translator</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#tool" className="text-slate-600 hover:text-blue-600 font-medium">الأداة</a>
              <a href="#about" className="text-slate-600 hover:text-blue-600 font-medium">عن المدرس</a>
              <a href="https://wa.me/966595440236" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm">
                 <Phone className="w-4 h-4" /> تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-white relative overflow-hidden pb-12 pt-12 lg:pt-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 border border-blue-100">
              <Award className="w-4 h-4" /><span>خدمة ترجمة تعليمية احترافية</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
              حول حديثك إلى نص <span className="text-blue-600">أكاديمي مترجم</span>
            </h2>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              منصة تعليمية بإشراف الأستاذ عامر المومني. سجل ملاحظاتك بالعربية، وسيقوم النظام بترجمتها لإنجليزية أكاديمية رصينة.
            </p>
            <div id="about" className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 inline-block max-w-3xl w-full mx-auto">
              <div className="bg-slate-50 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 md:justify-between">
                 <div className="flex items-center gap-4 text-right">
                    <div className="bg-slate-200 p-3 rounded-full"><GraduationCap className="w-8 h-8 text-slate-700" /></div>
                    <div>
                       <h3 className="font-bold text-lg text-slate-800">الأستاذ عامر المومني</h3>
                       <p className="text-slate-500 text-sm">أستاذ اللغة الإنجليزية | معتمد من كامبريج</p>
                    </div>
                 </div>
                 <div className="h-px w-full md:w-px md:h-12 bg-slate-300"></div>
                 <div className="flex gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" />الجبيل، السعودية</div>
                    <a href="https://wa.me/966595440236" className="flex items-center gap-2 hover:text-green-600 font-mono font-semibold dir-ltr"><Phone className="w-4 h-4 text-green-500" />0595440236</a>
                 </div>
              </div>
            </div>
         </div>
      </header>

      {/* Main Tool */}
      <main id="tool" className="flex-grow py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
               <div className="flex items-center gap-2 text-white"><BookOpen className="w-5 h-5 text-blue-400" /><span className="font-medium">مساحة العمل</span></div>
               <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
            </div>

            <div className="p-8 md:p-12">
              {!result && (
                <div className="flex flex-col items-center justify-center py-4 space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-slate-800">ابدأ التسجيل الصوتي</h3>
                    <p className="text-slate-500">اضغط على الميكروفون وتحدث بوضوح</p>
                  </div>
                  <div className="relative group">
                    {isRecording && <div className="absolute inset-0 rounded-full bg-red-100 recording-pulse"></div>}
                    <button onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing} className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 border-4 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white border-red-100' : audioBlob ? 'bg-white text-blue-600 border-blue-100 shadow-lg' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-100 shadow-blue-200'} shadow-xl`}>
                      {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-10 h-10" />}
                    </button>
                  </div>
                  <div className="h-8 flex items-center justify-center w-full">
                     {isRecording ? <span className="text-red-500 font-medium animate-pulse bg-red-50 px-4 py-1 rounded-full text-sm">جاري التسجيل...</span> : audioBlob ? <div className="flex items-center gap-4 w-full max-w-xs bg-slate-50 p-2 rounded-lg border border-slate-200"><audio src={audioUrl || ''} controls className="w-full h-8" /><button onClick={startRecording} className="p-2 hover:bg-white rounded-full text-slate-500 shadow-sm"><RefreshCw className="w-4 h-4" /></button></div> : <span className="text-slate-400 text-sm">جاهز للبدء</span>}
                  </div>
                  {audioBlob && !isRecording && (
                    <button onClick={translateAudio} disabled={isProcessing} className="w-full max-w-sm py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg">
                      {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />جاري المعالجة...</> : <>ترجم النص الآن<Languages className="w-5 h-5" /></>}
                    </button>
                  )}
                </div>
              )}

              {result && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="grid md:grid-cols-2 gap-6 relative">
                     <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow border border-slate-100 text-slate-300"><ArrowLeft className="w-5 h-5" /></div>
                     <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100"><div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3"><div className="flex items-center gap-2 text-slate-500 font-semibold"><Volume2 className="w-4 h-4" /><span>النص الأصلي</span></div><span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">AR</span></div><p className="text-lg leading-loose text-slate-800">{result.transcription}</p></div>
                     <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100" dir="ltr"><div className="flex items-center justify-between mb-4 border-b border-blue-200/50 pb-3"><div className="flex items-center gap-2 text-blue-700 font-semibold"><Languages className="w-4 h-4" /><span>Translation</span></div><span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded border border-blue-100">EN</span></div><p className="text-lg leading-loose text-slate-800 font-medium font-serif">{result.translation}</p></div>
                  </div>
                  <div className="flex justify-center pt-6 border-t border-slate-100">
                    <button onClick={reset} className="text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-2 px-6 py-3 hover:bg-slate-50 rounded-full transition-all"><RefreshCw className="w-5 h-5" />ترجمة نص جديد</button>
                  </div>
                </div>
              )}
              {error && <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">{error}</div>}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
               <div><h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" />المترجم الأكاديمي</h4><p className="text-slate-400 text-sm leading-relaxed">أداة تعليمية متطورة تهدف لمساعدة الطلاب والباحثين على صياغة أفكارهم بلغة إنجليزية أكاديمية دقيقة.</p></div>
               <div><h4 className="text-white font-bold text-lg mb-4">روابط هامة</h4><ul className="space-y-2 text-sm"><li><a href="#" className="hover:text-white transition-colors">الرئيسية</a></li><li><a href="#about" className="hover:text-white transition-colors">عن المدرس</a></li><li><a href="#tool" className="hover:text-white transition-colors">ابدأ الترجمة</a></li></ul></div>
               <div><h4 className="text-white font-bold text-lg mb-4">تواصل معنا</h4><ul className="space-y-2 text-sm"><li className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /><span dir="ltr">0595440236</span></li><li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /><span>الجبيل، المملكة العربية السعودية</span></li></ul></div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
               <p>© 2024 جميع الحقوق محفوظة للأستاذ عامر المومني.</p>
               <p className="flex items-center gap-1">Powered by <span className="text-slate-300 font-semibold">Google Gemini</span></p>
            </div>
         </div>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
