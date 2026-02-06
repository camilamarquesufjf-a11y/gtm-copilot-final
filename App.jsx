import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Target, Globe, Swords, MessageSquare, Copy, Play, Loader2, 
  CheckCircle, AlertCircle, XCircle, ChevronRight, ShieldAlert, Zap, Layout, 
  FileText, Users, DollarSign, Clock, Shield, BarChart3, AlertTriangle, 
  Zap as ZapIcon, Download, ArrowLeft, ArrowRight, RotateCcw, Moon, Sun,
  Keyboard, Share2, Briefcase, TrendingUp, Layers, UserCheck, Scale, AlertOctagon,
  ChevronLeft, Building2, User, Server, Database, Lock
} from 'lucide-react';

// === CONFIGURAÇÃO ===
const USE_MOCK = false; 
const GEMINI_MODEL = "gemini-2.0-flash-exp"; 

// VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};
const wizardVariants = {
  enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0, scale: 0.95 }),
  center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0, scale: 0.95 })
};

const fieldLabels = {
  productName: "Nome do Produto", description: "Descrição", stage: "Estágio",
  persona: "Persona", pricing: "Precificação", churnRate: "Churn Rate",
  comp1: "Competidor Principal", urgency: "Urgência"
};

const GTMCopilot = () => {
  // UI States
  const [activeTab, setActiveTab] = useState('input');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  
  // API Keys (BYOK)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gtm_gemini_key') || '');
  const [perplexityApiKey, setPerplexityApiKey] = useState(() => localStorage.getItem('gtm_pplx_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState({});

  // Form Data
  const [formData, setFormData] = useState({
    productName: '', description: '', stage: '',
    businessType: 'B2B', accountSize: '', persona: '', numCustomers: '',
    pricing: '', ticketVal: '', churnRate: '15', nrrTarget: '110', gtmMotion: '',
    comp1: '', comp2: '', comp3: '', whereLose: '',
    urgency: '', timeline: '', riskCustomers: '', tamRisk: 0,
    audience: '', competitors: '', pain: '',
  });

  const criticalFields = ['productName', 'description', 'stage', 'persona', 'pricing', 'churnRate', 'comp1', 'urgency'];
  const isPipelineReady = () => criticalFields.every(field => formData[field] && formData[field].toString().trim() !== '');

  // Pipeline State
  const [status, setStatus] = useState('idle');
  const [pipelineStep, setPipelineStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Outputs
  const [perplexityIntel, setPerplexityIntel] = useState(null);
  const [strategyCore, setStrategyCore] = useState(null);
  const [battlecards, setBattlecards] = useState(null);
  const [messaging, setMessaging] = useState(null);

  // Refs
  const strategyRef = useRef(null);
  const assetsRef = useRef(null);
  const errorRef = useRef(null);

  // EFFECTS
  useEffect(() => {
    const savedTheme = localStorage.getItem('gtm_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (status === 'idle' && activeTab === 'input' && currentStep === 5) runGTMPipeline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const savedForm = localStorage.getItem('gtm_formData');
    if (savedForm) {
       try { setFormData(prev => ({...prev, ...JSON.parse(savedForm)})); } catch(e){}
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gtm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gtm_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('gtm_formData', JSON.stringify(formData));
    const risk = (Number(formData.ticketVal) || 0) * (Number(formData.riskCustomers) || 0);
    setFormData(prev => {
      if (prev.tamRisk !== risk) return {...prev, tamRisk: risk};
      return prev;
    });
    setFormData(prev => ({
      ...prev,
      competitors: `${prev.comp1}, ${prev.comp2}, ${prev.comp3}`,
      audience: `${prev.persona} (${prev.businessType})`
    }));
  }, [formData.ticketVal, formData.riskCustomers, formData.comp1, formData.comp2, formData.comp3, formData.persona, formData.businessType]);

  // LOGIC
  const validateStep = (step) => {
    const newErrors = {};
    const check = (field) => {
      if (!formData[field] || formData[field].toString().trim() === '') newErrors[field] = true;
    };
    if (step === 1) { check('productName'); check('description'); }
    if (step === 2) { check('persona'); }
    if (step === 3) { check('pricing'); }
    if (step === 4) { check('comp1'); }
    if (step === 5) { check('urgency'); }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };
  const handlePrev = () => {
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleSaveKeys = (newGeminiKey, newPplxKey) => {
    setApiKey(newGeminiKey);
    setPerplexityApiKey(newPplxKey);
    localStorage.setItem('gtm_gemini_key', newGeminiKey);
    localStorage.setItem('gtm_pplx_key', newPplxKey);
    setShowApiKeyModal(false);
  };

  const cleanJSON = (text) => {
    if (!text) return null;
    let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
    try { return JSON.parse(clean); } 
    catch (e) { return null; }
  };

  const runGTMPipeline = async () => {
    if (!apiKey) {
      setStatus('error');
      setErrorMsg("Chave Gemini não configurada.");
      setShowApiKeyModal(true);
      return;
    }
    if (!isPipelineReady()) {
      setErrorMsg("⚠️ Preencha os campos obrigatórios");
      validateStep(currentStep);
      return;
    }
  
    setStatus('processing');
    setPipelineStep(0);
    setErrorMsg('');
    setStatusMessage('🔥 Iniciando Live APIs...');
    setStrategyCore(null);
    setBattlecards(null);
    setMessaging(null);
    setPerplexityIntel(null);
  
    try {
      // 1. INTEL
      setPipelineStep(1);
      setStatusMessage('🕵️ 1/4 Market Intel (Search)...');
      
      const intelPrompt = `Faça uma análise de mercado BR 2026 para ${formData.productName}. Contexto: Competidores: ${formData.comp1}, ${formData.comp2}. Persona: ${formData.persona}. Responda em 200 palavras sobre tendências e gaps.`;
      
      try {
        const intelRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: intelPrompt }] }],
              generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
              tools: [{ googleSearch: {} }]
            })
        });
        const intelData = await intelRes.json();
        const intelText = intelData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (intelText) setPerplexityIntel({ insight: intelText });
      } catch (e) { console.warn("Intel fail", e); }

      // 2. STRATEGY
      setPipelineStep(2);
      setStatusMessage('🧠 2/4 Strategy Core...');
      const strategyPrompt = `Você é um PMM Sênior. Gere estratégia GTM JSON para: ${JSON.stringify(formData)}. 
      RETORNE JSON VÁLIDO: { "gtm_thesis": { "enemy": "", "why_now": "" }, "strategic_thesis": { "positioning": { "unique_value": "" } }, "gtm_strategy_doc": "# Markdown Stragegy..." }`;
      
      const coreRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: strategyPrompt }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      const coreData = await coreRes.json();
      setStrategyCore(cleanJSON(coreData.candidates?.[0]?.content?.parts?.[0]?.text));

      // 3. ASSETS
      setPipelineStep(3);
      setStatusMessage('⚔️ 3/4 Assets Táticos...');
      const battlePrompt = `Gere Battlecards JSON para ${formData.productName} vs ${formData.comp1}. JSON: { "status_quo": { "enemy": "", "why_it_fails": "" }, "main_competitor": { "competitor": "", "our_advantage": "" } }`;
      const msgPrompt = `Gere Messaging JSON para ${formData.productName}. JSON: { "core_message": "", "sub_headline": "", "value_pillars": [{ "pillar": "", "proof": "" }] }`;

      const [battleRes, msgRes] = await Promise.all([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
           method: 'POST', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ contents: [{ parts: [{ text: battlePrompt }] }], generationConfig: { responseMimeType: "application/json" } })
        }),
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
           method: 'POST', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ contents: [{ parts: [{ text: msgPrompt }] }], generationConfig: { responseMimeType: "application/json" } })
        })
      ]);
      const battleData = await battleRes.json();
      const msgData = await msgRes.json();
      setBattlecards(cleanJSON(battleData.candidates?.[0]?.content?.parts?.[0]?.text));
      setMessaging(cleanJSON(msgData.candidates?.[0]?.content?.parts?.[0]?.text));

      setPipelineStep(4);
      setStatus('success');
      setStatusMessage('✅ Pronto!');
      setActiveTab('strategy');

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || "Erro desconhecido. Verifique a chave API.");
      if(err.message.includes('400')) setShowApiKeyModal(true);
    }
  };

  // RENDER
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><ZapIcon className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-lg">GTM<span className="text-indigo-500">Copilot</span></span>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowApiKeyModal(true)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400" title="Configurar API"><Shield className="w-5 h-5" /></button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          </div>
        </div>
      </header>

      {/* MODAL CONFIG */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <h3 className="text-xl font-bold mb-4 flex gap-2"><Shield className="text-indigo-500"/> Configurar Acesso</h3>
              <p className="text-sm text-slate-400 mb-4">Insira sua chave do Google Gemini (gratuita) para usar a ferramenta.</p>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." className="w-full p-3 rounded bg-slate-900 border border-slate-600 text-white mb-2"/>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs text-indigo-400 hover:underline block text-right mb-4">Gerar Chave Grátis →</a>
              <div className="flex gap-2">
                 <button onClick={() => setShowApiKeyModal(false)} className="flex-1 p-3 text-slate-400">Cancelar</button>
                 <button onClick={() => handleSaveKeys(apiKey, perplexityApiKey)} className="flex-1 p-3 bg-indigo-600 text-white rounded font-bold">Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* WIZARD & CONTENT */}
        {activeTab === 'input' && (
          <div className={`p-8 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white shadow-lg'}`}>
             {/* Progress Bar */}
             <div className="w-full bg-slate-700 h-2 rounded-full mb-8"><div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(currentStep / 5) * 100}%` }}></div></div>
             
             {/* STEPS (Resumo para brevidade, adicione seus inputs aqui seguindo o padrão do seu arquivo original) */}
             <div className="min-h-[300px]">
                <h2 className="text-2xl font-bold mb-6">Passo {currentStep}: {['Produto', 'ICP', 'Comercial', 'Competidores', 'Prioridade'][currentStep-1]}</h2>
                
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <input name="productName" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} placeholder="Nome do Produto" className="w-full p-4 rounded bg-slate-900 border border-slate-700 text-white" />
                    <textarea name="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="O que o produto faz?" className="w-full p-4 rounded bg-slate-900 border border-slate-700 text-white h-32" />
                  </div>
                )}
                 {currentStep === 2 && (
                  <div className="space-y-4">
                    <input name="persona" value={formData.persona} onChange={e => setFormData({...formData, persona: e.target.value})} placeholder="Quem compra? (Ex: CEO, Gerente de Mkt)" className="w-full p-4 rounded bg-slate-900 border border-slate-700 text-white" />
                  </div>
                )}
                 {currentStep === 3 && (
                  <div className="space-y-4">
                    <input name="pricing" value={formData.pricing} onChange={e => setFormData({...formData, pricing: e.target.value})} placeholder="Preço (Ex: R$ 500/mês)" className="w-full p-4 rounded bg-slate-900 border border-slate-700 text-white" />
                  </div>
                )}
                 {currentStep === 4 && (
                  <div className="space-y-4">
                    <input name="comp1" value={formData.comp1} onChange={e => setFormData({...formData, comp1: e.target.value})} placeholder="Principal Concorrente" className="w-full p-4 rounded bg-slate-900 border border-slate-700 text-white" />
                    <input name="comp2" value={formData.comp2} onChange={e => setFormData({...formData, comp2: e.target.value})} placeholder="Concorrente Secundário" className="w-full p-4 rounded bg-slate-900 border border-slate-700 text-white" />
                  </div>
                )}
                 {currentStep === 5 && (
                  <div className="space-y-4">
                    <input name="urgency" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})} placeholder="Nível de Urgência" className="w-full p-4 rounded bg-slate-900 border border-slate-700 text-white" />
                  </div>
                )}
             </div>

             {/* Navigation */}
             <div className="flex justify-between mt-8 pt-8 border-t border-slate-700">
               <button onClick={handlePrev} disabled={currentStep === 1} className="px-6 py-3 rounded text-slate-400 disabled:opacity-30">Voltar</button>
               {currentStep < 5 ? (
                 <button onClick={handleNext} className="px-6 py-3 bg-indigo-600 rounded text-white font-bold flex items-center gap-2">Próximo <ChevronRight size={20}/></button>
               ) : (
                 <button onClick={runGTMPipeline} disabled={status === 'processing'} className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded text-white font-bold flex items-center gap-2 disabled:opacity-50">
                    {status === 'processing' ? <Loader2 className="animate-spin"/> : <Zap size={20}/>} Gerar Estratégia
                 </button>
               )}
             </div>
             
             {/* Status Message */}
             {status === 'processing' && <div className="mt-4 text-center text-indigo-400 animate-pulse">{statusMessage}</div>}
             {errorMsg && <div className="mt-4 text-center text-red-400 bg-red-900/20 p-2 rounded border border-red-500/30">{errorMsg}</div>}
          </div>
        )}

        {/* RESULTS TAB (Só aparece quando success) */}
        {activeTab === 'strategy' && strategyCore && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <button onClick={() => setActiveTab('input')} className="mb-4 text-sm text-slate-400 hover:text-white flex items-center gap-1">← Voltar para edição</button>
            
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">🎯 Tese Central</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-slate-900 rounded border border-slate-700">
                   <h3 className="text-indigo-400 text-sm font-bold uppercase mb-2">Inimigo</h3>
                   <p>{strategyCore.gtm_thesis?.enemy}</p>
                </div>
                 <div className="p-4 bg-slate-900 rounded border border-slate-700">
                   <h3 className="text-indigo-400 text-sm font-bold uppercase mb-2">Por que agora?</h3>
                   <p>{strategyCore.gtm_thesis?.why_now}</p>
                </div>
              </div>
              <div className="prose prose-invert max-w-none bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                <pre className="whitespace-pre-wrap font-sans text-slate-300 text-sm leading-relaxed">{strategyCore.gtm_strategy_doc}</pre>
              </div>
            </div>

            {battlecards && (
              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-4">⚔️ Battlecards</h2>
                <div className="p-4 bg-slate-900 rounded border border-red-900/30 mb-4">
                  <h3 className="text-red-400 font-bold mb-1">Como vencer {formData.comp1}</h3>
                  <p className="text-slate-300">{battlecards.main_competitor?.our_advantage}</p>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default GTMCopilot;
