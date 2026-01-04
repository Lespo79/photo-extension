
import React, { useState, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { GoogleGenAI } from "@google/genai";

const html = htm.bind(React.createElement);

// --- CONSTANTES ET TYPES ---
const TARGET_FORMATS = [
  { extension: 'jpg', description: 'JPEG Standard' },
  { extension: 'jpeg', description: 'JPEG Haute Qualité' },
  { extension: 'jfif', description: 'JPEG Interchange' },
  { extension: 'png', description: 'PNG Transparent' },
  { extension: 'webp', description: 'Format Web Moderne' },
  { extension: 'gif', description: 'GIF Animé/Statique' },
  { extension: 'bmp', description: 'Bitmap Windows' },
  { extension: 'tiff', description: 'Format Professionnel' },
  { extension: 'svg', description: 'Vecteur (Conteneur)' },
  { extension: 'heic', description: 'iPhone High Efficiency' },
  { extension: 'psd', description: 'Adobe Photoshop' },
  { extension: 'raw', description: 'Données Brutes' },
  { extension: 'dng', description: 'Digital Negative' },
  { extension: 'ico', description: 'Icône Windows' },
  { extension: 'ai', description: 'Adobe Illustrator' },
  { extension: 'eps', description: 'PostScript' },
  { extension: 'pdf', description: 'Document Portable' },
  { extension: 'exr', description: 'HDR Professionnel' },
  { extension: 'kra', description: 'Krita Document' },
  { extension: 'xcf', description: 'GIMP Project' }
].sort((a, b) => a.extension.localeCompare(b.extension));

// --- COMPOSANTS ---

const Logo = () => html`
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style=${{ stopColor: '#3b82f6' }} />
        <stop offset="100%" style=${{ stopColor: '#1d4ed8' }} />
      </linearGradient>
      <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style=${{ stopColor: '#a855f7' }} />
        <stop offset="100%" style=${{ stopColor: '#7e22ce' }} />
      </linearGradient>
    </defs>
    <path d="M50 15 A35 35 0 0 1 85 50" fill="none" stroke="url(#grad-blue)" strokeWidth="8" strokeLinecap="round" />
    <path d="M85 50 L90 42 L80 42 Z" fill="#3b82f6" />
    <path d="M50 85 A35 35 0 0 1 15 50" fill="none" stroke="url(#grad-purple)" strokeWidth="8" strokeLinecap="round" />
    <path d="M15 50 L10 58 L20 58 Z" fill="#a855f7" />
    <rect x="22" y="38" width="24" height="24" rx="4" fill="#1e3a8a" />
    <text x="34" y="53" fontSize="7" fill="white" fontWeight="900" textAnchor="middle">JPG</text>
    <path d="M48 50 L52 50" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    <path d="M52 50 L50 48 M52 50 L50 52" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    <rect x="54" y="38" width="24" height="24" rx="4" fill="#f97316" />
    <text x="66" y="53" fontSize="7" fill="white" fontWeight="900" textAnchor="middle">PNG</text>
  </svg>
`;

const App = () => {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState('jpg');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [insight, setInsight] = useState('');
  const fileInput = useRef(null);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'image/png') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFile({
          name: f.name.replace('.png', ''),
          preview: ev.target.result,
          raw: f
        });
        setDone(false);
        setInsight('');
      };
      reader.readAsDataURL(f);
    } else {
      alert("Veuillez choisir un fichier PNG.");
    }
  };

  const askAI = async () => {
    if (!file || !process.env.API_KEY) return;
    setInsight('L\'IA analyse votre image...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/png', data: file.preview.split(',')[1] } },
            { text: `Analyse cette image et explique pourquoi l'extension .${target} est un bon choix ou non. Donne 2 conseils techniques en français.` }
          ]
        }]
      });
      setInsight(response.text);
    } catch (e) {
      setInsight("Conseil : Assurez-vous d'utiliser une compression de 80% pour un bon ratio qualité/poids.");
    }
  };

  const convert = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const img = new Image();
    img.src = file.preview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      let mime = 'image/jpeg';
      if (target === 'webp') mime = 'image/webp';
      if (target === 'png') mime = 'image/png';

      const dataUrl = canvas.toDataURL(mime, 0.9);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${file.name}.${target}`;
      link.click();
      
      setLoading(false);
      setDone(true);
    };
  };

  return html`
    <div className="min-h-screen flex flex-col p-4 md:p-10">
      <header className="max-w-6xl mx-auto w-full flex items-center gap-5 mb-12 animate-fade">
        <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-2xl">
          <${Logo} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Photo Extension
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">Convertisseur d'images universel</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full flex-1">
        ${!file ? html`
          <div 
            onClick=${() => fileInput.current.click()}
            className="h-[450px] rounded-[3rem] border-2 border-dashed border-slate-800 bg-slate-900/30 hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all flex flex-col items-center justify-center cursor-pointer group animate-fade"
          >
            <input type="file" ref=${fileInput} onChange=${onFileChange} accept=".png" className="hidden" />
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 transition-all">
              <svg className="w-10 h-10 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Cliquez pour ajouter un PNG</h2>
            <p className="text-slate-500 text-sm">Changement d'extension instantané vers +20 formats</p>
          </div>
        ` : html`
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade">
            <div className="lg:col-span-7 space-y-6">
              <div className="glass rounded-[2.5rem] p-4 overflow-hidden">
                <img src=${file.preview} className="w-full h-auto rounded-3xl object-contain max-h-[400px] bg-slate-900/50" />
              </div>
              
              <div className="glass rounded-[2.5rem] p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">✨</div>
                  <h3 className="font-bold">Optimisation Photo Extension</h3>
                </div>
                ${insight ? html`
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-5 rounded-2xl border border-white/5">${insight}</p>
                ` : html`
                  <button onClick=${askAI} className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300">
                    Demander conseil à l'IA pour .${target}
                  </button>
                `}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="glass rounded-[2.5rem] p-8 sticky top-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Extensions de sortie</h3>
                  <button onClick=${() => setFile(null)} className="text-[10px] text-red-400 font-black">ANNULER</button>
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-10">
                  ${TARGET_FORMATS.map(f => html`
                    <button 
                      key=${f.extension}
                      onClick=${() => { setTarget(f.extension); setDone(false); }}
                      className=${`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${target === f.extension ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:bg-slate-800'}`}
                    >
                      .${f.extension}
                    </button>
                  `)}
                </div>

                ${loading ? html`
                  <div className="w-full h-14 bg-slate-800 rounded-3xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-indigo-600/20 animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-widest">Traitement...</span>
                  </div>
                ` : done ? html`
                  <div className="w-full py-5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-3xl text-center font-black text-xs tracking-widest uppercase">
                    Téléchargement prêt !
                  </div>
                ` : html`
                  <button 
                    onClick=${convert}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-sm tracking-widest uppercase shadow-2xl shadow-indigo-600/40 transition-all active:scale-95"
                  >
                    TÉLÉCHARGER .${target.toUpperCase()}
                  </button>
                `}
              </div>
            </div>
          </div>
        `}
      </main>

      <footer className="mt-20 py-10 border-t border-white/5 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
        &copy; 2024 Photo Extension • Solution d'exportation d'images
      </footer>
    </div>
  `;
};

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
