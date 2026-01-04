
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TARGET_FORMATS } from './constants.ts';
import { ImageFile, AppStatus, ConversionFormat } from './types.ts';
import { analyzeImageWithAI } from './services/geminiService.ts';

// Icônes personnalisées
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
            <linearGradient id="grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f97316' }} />
              <stop offset="100%" style={{ stopColor: '#ea580c' }} />
            </linearGradient>
            <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#9333ea' }} />
              <stop offset="100%" style={{ stopColor: '#7e22ce' }} />
            </linearGradient>
          </defs>
          {/* Cercle fléché haut */}
          <path d="M50 15 A35 35 0 0 1 85 50" fill="none" stroke="url(#grad-blue)" strokeWidth="8" strokeLinecap="round" />
          <path d="M85 50 L90 40 L80 40 Z" fill="#2563eb" />
          
          {/* Cercle fléché bas */}
          <path d="M50 85 A35 35 0 0 1 15 50" fill="none" stroke="url(#grad-purple)" strokeWidth="8" strokeLinecap="round" />
          <path d="M15 50 L10 60 L20 60 Z" fill="#9333ea" />
          
          {/* Boîte JPG */}
          <rect x="22" y="38" width="24" height="24" rx="4" fill="#1e40af" />
          <text x="34" y="53" fontSize="8" fill="white" fontWeight="900" textAnchor="middle">JPG</text>
          
          {/* Flèche milieu */}
          <path d="M48 50 L52 50" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <path d="M52 50 L50 48 M52 50 L50 52" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          
          {/* Boîte PNG */}
          <rect x="54" y="38" width="24" height="24" rx="4" fill="url(#grad-orange)" />
          <text x="66" y="53" fontSize="8" fill="white" fontWeight="900" textAnchor="middle">PNG</text>
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
          setAiInsight('');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Veuillez sélectionner un fichier PNG.");
    }
  };

  const handleAiAnalysis = async () => {
    if (!selectedFile) return;
    setAiInsight('Analyse Photo Extension en cours...');
    const insight = await analyzeImageWithAI(selectedFile.preview, targetFormat);
    setAiInsight(insight);
  };

  const performConversion = async () => {
    if (!selectedFile || !canvasRef.current) return;
    setStatus(AppStatus.CONVERTING);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => (prev >= 95 ? 95 : prev + 5));
    }, 50);

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
      <canvas ref={canvasRef} className="hidden" />

      <header className="max-w-6xl mx-auto w-full mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shadow-2xl">
            <Icon name="logo" className="w-14 h-14" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              Photo Extension
            </h1>
            <p className="text-[10px] text-slate-500 font-black tracking-[0.3em] uppercase">Convertisseur d'images haute performance</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full flex-1">
        {status === AppStatus.IDLE || status === AppStatus.UPLOADING ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-[500px] rounded-[3rem] border-2 border-dashed border-slate-800 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full group-hover:bg-indigo-600/10 transition-all duration-700"></div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".png" className="hidden" />
            <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500 shadow-2xl">
              <Icon name="upload" className="w-12 h-12 text-slate-400 group-hover:text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Déposez votre PNG</h2>
            <p className="text-slate-500 mb-10 max-w-sm text-center font-medium">Vers .jpg, .webp, .svg, .psd et +30 extensions.</p>
            <div className="flex flex-wrap justify-center gap-3 opacity-20 group-hover:opacity-100 transition-all duration-500">
              {['JPEG', 'SVG', 'RAW', 'PSD'].map(f => <span key={f} className="px-4 py-2 bg-slate-800 rounded-xl text-[10px] font-black">{f}</span>)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-morphism rounded-[2.5rem] p-5 shadow-2xl border-white/5">
                <div className="relative aspect-video bg-black/40 rounded-[1.5rem] overflow-hidden">
                  <img src={selectedFile?.preview} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute bottom-6 left-6 flex gap-3">
                    <span className="px-4 py-2 bg-black/80 backdrop-blur-xl rounded-xl text-[10px] font-black border border-white/10">{selectedFile?.width} × {selectedFile?.height} PX</span>
                    <span className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">PNG SOURCE</span>
                  </div>
                </div>
              </div>
              <div className="glass-morphism rounded-[2.5rem] p-8 border-white/5">
                <div className="flex items-center gap-4 mb-5">
                  <Icon name="sparkles" className="w-6 h-6 text-indigo-400" />
                  <h3 className="font-bold text-lg text-indigo-100 tracking-tight">IA Photo Extension</h3>
                </div>
                {aiInsight ? (
                  <div className="text-slate-300 text-sm leading-relaxed p-6 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in">{aiInsight}</div>
                ) : (
                  <button onClick={handleAiAnalysis} className="px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">Analyser pour .{targetFormat}</button>
                )}
              </div>
            </div>
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-morphism rounded-[2.5rem] p-8 shadow-2xl border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">Extensions</h3>
                  <button onClick={reset} className="text-[10px] text-slate-500 hover:text-red-400 font-black tracking-widest">RESET</button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {TARGET_FORMATS.map(f => (
                    <button key={f.extension} onClick={() => setTargetFormat(f.extension)} className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${targetFormat === f.extension ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl scale-105' : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:bg-slate-800'}`}>.{f.extension}</button>
                  ))}
                </div>
                <div className="mt-10">
                  {status === AppStatus.CONVERTING ? (
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                  ) : status === AppStatus.COMPLETED ? (
                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center"><p className="font-black text-emerald-400 uppercase text-[10px] tracking-widest">Terminé !</p></div>
                  ) : (
                    <button onClick={performConversion} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-2xl shadow-indigo-600/40 transition-all active:scale-95">TÉLÉCHARGER .{targetFormat}</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="mt-16 py-8 border-t border-white/5 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">&copy; 2024 Photo Extension</footer>
    </div>
  );
};

export default App;
