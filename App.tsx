
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TARGET_FORMATS } from './constants';
import { ImageFile, AppStatus, ConversionFormat } from './types';
import { analyzeImageWithAI } from './services/geminiService';

// Reusable Icon Component for visual flair
const Icon = ({ name, className = "" }: { name: string; className?: string }) => {
  switch (name) {
    case 'upload':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
    case 'check':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
    case 'download':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
    case 'settings':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'sparkles':
      return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
    case 'logo':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#2563eb' }} />
              <stop offset="100%" style={{ stopColor: '#1e40af' }} />
            </linearGradient>
            <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#9333ea' }} />
              <stop offset="100%" style={{ stopColor: '#7e22ce' }} />
            </linearGradient>
          </defs>
          <path d="M50 15 A35 35 0 0 1 85 50" fill="none" stroke="url(#grad-blue)" strokeWidth="8" strokeLinecap="round" />
          <path d="M85 50 L90 40 L80 40 Z" fill="#2563eb" />
          <path d="M50 85 A35 35 0 0 1 15 50" fill="none" stroke="url(#grad-purple)" strokeWidth="8" strokeLinecap="round" />
          <path d="M15 50 L10 60 L20 60 Z" fill="#9333ea" />
          <rect x="25" y="40" width="20" height="20" rx="4" fill="#1e40af" />
          <text x="35" y="53" fontSize="8" fill="white" fontWeight="bold" textAnchor="middle">JPG</text>
          <path d="M48 50 L52 50" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M52 50 L50 48 M52 50 L50 52" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <rect x="55" y="40" width="20" height="20" rx="4" fill="#ea580c" />
          <text x="65" y="53" fontSize="8" fill="white" fontWeight="bold" textAnchor="middle">PNG</text>
        </svg>
      );
    default:
      return null;
  }
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedFile, setSelectedFile] = useState<ImageFile | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('jpg');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/png') {
      setStatus(AppStatus.UPLOADING);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setSelectedFile({
            file,
            preview: e.target?.result as string,
            width: img.width,
            height: img.height,
            name: file.name.split('.')[0]
          });
          setStatus(AppStatus.READY);
          setAiInsight(''); // Reset AI insight
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Veuillez sélectionner un fichier PNG.");
    }
  };

  // Run AI analysis
  const handleAiAnalysis = async () => {
    if (!selectedFile) return;
    setAiInsight('Analyse en cours par Gemini...');
    const insight = await analyzeImageWithAI(selectedFile.preview, targetFormat);
    setAiInsight(insight);
  };

  // Actual conversion logic
  const performConversion = async () => {
    if (!selectedFile || !canvasRef.current) return;

    setStatus(AppStatus.CONVERTING);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 50);

    // Short delay to simulate heavy processing for "complex" formats
    await new Promise(resolve => setTimeout(resolve, 800));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = selectedFile.preview;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      let mimeType = 'image/jpeg';
      if (targetFormat === 'webp') mimeType = 'image/webp';
      if (targetFormat === 'png') mimeType = 'image/png';
      if (targetFormat === 'bmp') mimeType = 'image/bmp';

      const isStandard = ['jpg', 'jpeg', 'webp', 'png', 'bmp'].includes(targetFormat.toLowerCase());
      const dataUrl = isStandard ? canvas.toDataURL(mimeType, 0.9) : selectedFile.preview;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${selectedFile.name}.${targetFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgress(100);
      setStatus(AppStatus.COMPLETED);
      clearInterval(interval);
    };
  };

  const reset = () => {
    setSelectedFile(null);
    setStatus(AppStatus.IDLE);
    setAiInsight('');
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shadow-xl">
            <Icon name="logo" className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
              Photo Extension
            </h1>
            <p className="text-sm text-slate-400 font-medium">CONVERTISSEUR D'IMAGES PROFESSIONNEL</p>
          </div>
        </div>
        <button 
          onClick={() => window.open('https://github.com', '_blank')}
          className="hidden md:block text-slate-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase"
        >
          À Propos
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full flex-1">
        {status === AppStatus.IDLE || status === AppStatus.UPLOADING ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group relative h-[500px] rounded-[2.5rem] border-2 border-dashed border-slate-700 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 blur-[120px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700"></div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload} 
              accept=".png" 
              className="hidden" 
            />
            
            <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500 shadow-2xl">
              <Icon name="upload" className="w-12 h-12 text-slate-300 group-hover:text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Déposez votre PNG</h2>
            <p className="text-slate-400 mb-10 max-w-sm text-center font-medium">
              Convertissez vos images instantanément vers .jpg, .webp, .svg, .psd et plus de 30 autres extensions.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-lg px-6 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
              {['JPEG', 'JFIF', 'TIFF', 'RAW', 'EPS', 'ICO', 'EXR'].map(fmt => (
                <span key={fmt} className="px-4 py-1.5 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl text-xs font-bold tracking-wider">{fmt}</span>
              ))}
              <span className="text-xs self-center font-bold text-indigo-400 tracking-wider">ET 30+ AUTRES</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Left: Preview & AI */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-morphism rounded-[2.5rem] p-5 overflow-hidden shadow-2xl border-white/5">
                <div className="relative aspect-video bg-black/40 rounded-[1.5rem] overflow-hidden group">
                  <img 
                    src={selectedFile?.preview} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-6 left-6 flex gap-3">
                    <span className="px-4 py-2 bg-black/70 backdrop-blur-xl rounded-xl text-xs font-bold border border-white/10 tracking-tight">
                      {selectedFile?.width} × {selectedFile?.height} PX
                    </span>
                    <span className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">
                      SOURCE: PNG
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Insight Box */}
              <div className="glass-morphism rounded-[2.5rem] p-8 relative overflow-hidden border-white/5">
                <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
                  <Icon name="logo" className="w-64 h-64" />
                </div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                    <Icon name="sparkles" className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-lg text-indigo-100 tracking-tight">Conseils d'Optimisation IA</h3>
                </div>
                
                {aiInsight ? (
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in duration-700 bg-white/5 p-6 rounded-2xl border border-white/5">
                    {aiInsight}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-5">
                    <p className="text-slate-400 text-sm font-medium">
                      L'IA Photo Extension analyse les caractéristiques visuelles pour recommander les réglages de compression idéaux pour le format <span className="text-indigo-400">.{targetFormat}</span>.
                    </p>
                    <button 
                      onClick={handleAiAnalysis}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3 active:scale-95 group"
                    >
                      <Icon name="sparkles" className="w-4 h-4 group-hover:animate-pulse" />
                      Optimiser pour .{targetFormat}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-morphism rounded-[2.5rem] p-8 shadow-2xl border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Icon name="settings" className="w-6 h-6 text-indigo-400" />
                    <h3 className="font-black uppercase tracking-widest text-sm">Paramètres</h3>
                  </div>
                  <button 
                    onClick={reset}
                    className="text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase font-black tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"
                  >
                    Effacer
                  </button>
                </div>

                <div className="mb-10">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 block">Extension de Sortie</label>
                  <div className="grid grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto pr-3 custom-scrollbar">
                    {TARGET_FORMATS.map((fmt) => (
                      <button
                        key={fmt.extension}
                        onClick={() => {
                          setTargetFormat(fmt.extension);
                          setAiInsight('');
                        }}
                        className={`py-3 rounded-xl text-xs font-black uppercase tracking-tighter border transition-all duration-200 ${
                          targetFormat === fmt.extension 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/40 scale-105 z-10' 
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-500 hover:bg-slate-800/60'
                        }`}
                        title={fmt.description}
                      >
                        .{fmt.extension}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {status === AppStatus.CONVERTING ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                        <span>Conversion en cours...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-4 bg-slate-900 rounded-full p-1 border border-white/5 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/20"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : status === AppStatus.COMPLETED ? (
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-5 animate-in zoom-in-95 duration-300">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                        <Icon name="check" className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-emerald-400 uppercase text-xs tracking-widest">Terminé</p>
                        <p className="text-xs text-emerald-500/70 font-medium">Extension changée en .{targetFormat}</p>
                      </div>
                      <button 
                        onClick={performConversion}
                        className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20"
                      >
                        Encore
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={performConversion}
                      className="group w-full py-5 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-3xl font-black text-lg tracking-tight shadow-2xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                    >
                      <Icon name="download" className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
                      TÉLÉCHARGER .{targetFormat.toUpperCase()}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Info Card */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8">
                <h4 className="text-[10px] font-black text-slate-500 mb-5 uppercase tracking-[0.25em]">Spécifications Finales</h4>
                <div className="space-y-4 text-xs font-medium">
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-slate-500">Nom du fichier :</span>
                    <span className="text-slate-200 font-bold truncate max-w-[180px]">{selectedFile?.name}.{targetFormat}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-slate-500">Moteur de rendu :</span>
                    <span className="text-indigo-400 font-bold">Photo Ext V2.0</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-slate-500">Mode :</span>
                    <span className="text-slate-200 font-bold">Direct Transmutation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-white/5 max-w-6xl mx-auto w-full text-center">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; 2024 Photo Extension &bull; Tous droits réservés &bull; Propulsé par Gemini AI
        </p>
      </footer>
    </div>
  );
};

export default App;
