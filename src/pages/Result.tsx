import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { Share2, Sparkles, RefreshCw, Download, ArrowLeft, Lightbulb, Loader2, AlertTriangle, CheckCircle, Brain, Check, X, Volume2, VolumeX } from 'lucide-react';

interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
}

interface MemeData {
  panel1: string;
  panel2: string;
  panel3: string;
  panel4: string;
  realExplanation: string;
}

interface LocationState {
  topic: string;
  category: string;
  template: string;
  difficulty: string;
  memeData: MemeData;
  imageUrl: string;
}

const Result: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // URL fallback params
  const fallbackTopic = searchParams.get('topic') || 'React useEffect';
  const fallbackDifficulty = searchParams.get('difficulty') || 'beginner';
  const fallbackTemplate = searchParams.get('template') || 'expanding-brain';

  // State management
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Brewing your meme lesson...');
  const [error, setError] = useState<string | null>(null);
  const [memeData, setMemeData] = useState<MemeData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [topic, setTopic] = useState<string>(fallbackTopic);
  const [template, setTemplate] = useState<string>(fallbackTemplate);
  const [difficulty, setDifficulty] = useState<string>(fallbackDifficulty);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quiz State
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'loading' | 'active' | 'submitted' | 'error'>('idle');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Speech State
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleToggleSpeech = () => {
    if (!memeData) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(memeData.realExplanation);
    
    // Find suitable local voice (Hindi or Indian English)
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('en-IN')) || voices[0];
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsPlayingSpeech(false);
    };
    utterance.onerror = () => {
      setIsPlayingSpeech(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingSpeech(true);
  };

  const handleLoadQuiz = async () => {
    if (!memeData) return;
    setQuizState('loading');
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          explanation: memeData.realExplanation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      setQuizData(data);
      setSelectedOption(null);
      setQuizState('active');
    } catch (err) {
      console.error(err);
      setQuizState('error');
    }
  };

  const handleSelectOption = (idx: number) => {
    if (quizState !== 'active') return;
    setSelectedOption(idx);
    setQuizState('submitted');
  };

  const loadingMessages = [
    'Brewing your meme lesson...',
    'Teaching the brain cells...',
    'Consulting the meme scholars...',
    'Synthesizing Hinglish humor...',
    'Overlaying text onto templates...',
    'Injecting extra brainrot captions...'
  ];

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[index]);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  // Load from location state or trigger API call if accessed directly
  useEffect(() => {
    const state = location.state as LocationState;
    if (state && state.memeData) {
      setTopic(state.topic);
      setTemplate(state.template);
      setDifficulty(state.difficulty);
      setMemeData(state.memeData);
      setImageUrl(state.imageUrl);
      setLoading(false);
    } else {
      // Trigger API fetch if loaded directly via URL parameters
      fetchMeme();
    }
  }, [location.state]);

  const fetchMeme = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-meme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: fallbackTopic,
          template: fallbackTemplate,
          language: 'Hinglish',
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate meme');
      }

      const data = await response.json();
      setTopic(data.topic || fallbackTopic);
      setTemplate(data.template || fallbackTemplate);
      setMemeData(data.meme);
      setImageUrl(data.imageUrl || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connection failed. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'MemeLearn Lesson',
      text: `Check out this educational meme on ${topic}: "${memeData?.realExplanation}"`,
      url: imageUrl || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch (err) {
        console.error('Web Share failed:', err);
      }
    } else {
      // Fallback copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Meme link copied to clipboard!');
      } catch (copyErr) {
        console.error('Could not copy link:', copyErr);
      }
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) {
      showToast('No image available to download.');
      return;
    }
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `MemeLearn_${topic.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast('Meme downloaded successfully!');
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handleRegenerate = async () => {
    await fetchMeme();
    showToast('Regenerated meme lesson!');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8 text-left relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-slate-900 border border-purple-500/30 px-4 py-3 rounded-xl shadow-xl animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Header / Back */}
      <div className="mb-6 flex items-center justify-between">
        <Link to="/create" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Create
        </Link>
        {!loading && !error && (
          <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Powered by Gemini + Pillow
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
            <Sparkles className="absolute w-6 h-6 text-pink-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Generating Meme Lesson</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">{loadingMessage}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="py-12 px-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-bold text-lg text-white">Generation Failed</h3>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchMeme}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Generation
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && memeData && (
        <div className="space-y-8">
          {/* Topic Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">
              Learning: <span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">{topic}</span>
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Difficulty: {difficulty} • Format: {template.replace('-', ' ')}
            </p>
          </div>

          {/* Meme Image Full Width */}
          <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl relative group">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={`${topic} Meme`}
                className="w-full h-auto object-contain bg-slate-950 block max-h-[500px]"
              />
            ) : (
              <div className="w-full aspect-video bg-slate-950 flex items-center justify-center text-slate-500 text-sm italic">
                Overlay image generation pending
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white text-sm font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4.5 h-4.5" />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:text-white text-sm font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4.5 h-4.5" />
              Download
            </button>
            <button
              onClick={handleRegenerate}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:border-purple-500/40 text-sm font-bold transition-all text-center active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4.5 h-4.5" />
              Regenerate
            </button>
          </div>

          {/* Quick Explanation Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                Quick Explanation
              </h3>
              <button
                type="button"
                onClick={handleToggleSpeech}
                title={isPlayingSpeech ? "Stop Audio" : "Listen Aloud"}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isPlayingSpeech 
                    ? "bg-purple-500/15 border-purple-500/35 text-purple-300 animate-pulse" 
                    : "bg-slate-950 border-slate-850 text-slate-400 hover:text-purple-400 hover:border-purple-500/30"
                }`}
              >
                {isPlayingSpeech ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              {memeData.realExplanation}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-500">
              <span>Method: Gemini Associative Learning</span>
              <span>Tone: Hinglish Tone</span>
            </div>
          </div>

          {/* 🧠 Test Your Memory! Quiz Card */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850">
            <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-500 animate-pulse" />
              Test Your Memory!
            </h3>

            {quizState === 'idle' && (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-slate-400">
                  Concept samajh aa gaya? Ek dynamic 1-question check-in test dekar self-verify karein!
                </p>
                <button
                  onClick={handleLoadQuiz}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Memory Test
                </button>
              </div>
            )}

            {quizState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-500 text-sm">
                <Loader2 className="w-7 h-7 text-pink-500 animate-spin" />
                <span>Generating dynamic MCQ using DeepSeek...</span>
              </div>
            )}

            {quizState === 'error' && (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-red-400">Failed to load quiz. DeepSeek might be busy.</p>
                <button
                  onClick={handleLoadQuiz}
                  className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

            {(quizState === 'active' || quizState === 'submitted') && quizData && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-200">{quizData.question}</p>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {quizData.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectChoice = quizData.correctIndex === idx;
                    let buttonClass = "w-full text-left px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-350 text-sm transition-all hover:bg-slate-900 cursor-pointer";

                    if (quizState === 'submitted') {
                      if (isCorrectChoice) {
                        buttonClass = "w-full text-left px-4 py-3 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-sm font-semibold flex items-center justify-between";
                      } else if (isSelected && !isCorrectChoice) {
                        buttonClass = "w-full text-left px-4 py-3 rounded-xl border border-red-500 bg-red-500/10 text-red-400 text-sm font-semibold flex items-center justify-between";
                      } else {
                        buttonClass = "w-full text-left px-4 py-3 rounded-xl border border-slate-850 bg-slate-950/40 text-slate-500 text-sm cursor-not-allowed";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={quizState === 'submitted'}
                        onClick={() => handleSelectOption(idx)}
                        className={buttonClass}
                      >
                        <span>{opt}</span>
                        {quizState === 'submitted' && isCorrectChoice && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        {quizState === 'submitted' && isSelected && !isCorrectChoice && <X className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {quizState === 'submitted' && (
                  <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-xs">
                    {selectedOption === quizData.correctIndex ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        🎉 Correct! +10 XP earned
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        ❌ Oops! Sahi option green wala tha.
                      </span>
                    )}
                    <button
                      onClick={handleLoadQuiz}
                      className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                    >
                      Another Question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;
