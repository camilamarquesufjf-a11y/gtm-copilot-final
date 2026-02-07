import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Zap, Target, Globe, Swords, MessageSquare, Copy, Play, Loader2, 
  CheckCircle, AlertCircle, XCircle, ChevronRight, ShieldAlert, Layout, 
  FileText, Users, DollarSign, Clock, Shield, BarChart3, AlertTriangle, 
  Download, ArrowLeft, RotateCcw, Moon, Sun, Briefcase, TrendingUp, Layers, 
  Scale, AlertOctagon, ChevronLeft, Building2, BrainCircuit, Share2, User
} from 'lucide-react';

// === CONFIGURAÇÕES ===
const GEMINI_MODEL = "gemini-2.0-flash-exp"; 

// === FUNÇÕES AUXILIARES ===
const cleanJSON = (text) => {
  if (!text) return null;
  let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
  try { return JSON.parse(clean); } 
  catch (e) { return null; }
};

const GTMCopilot = () => {
  // === THEME & API ===
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gtm_gemini_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // === WIZARD STATES ===
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState({});
  const [showPresets, setShowPresets] = useState(false);

  // === FORM DATA ===
  const [formData, setFormData] = useState({
    productName: '', description: '', stage: 'Novo Produto',
    businessType: 'B2B', persona: '', pricing: '', 
    comp1: '', comp2: '', comp3: '', urgency: '', ticketVal: '', 
    timeline: '', riskCustomers: ''
  });

  // === PIPELINE STATES ===
  const [status, setStatus] = useState('idle');
  const [pipelineStep, setPipelineStep] = useState(0); 
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // === OUTPUTS ===
  const [marketIntel, setMarketIntel] = useState(null);
  const [strategyCore, setStrategyCore] = useState(null);
  const [battlecards, setBattlecards] = useState(null);
  const [messaging, setMessaging] = useState(null);
  const [activeTab, setActiveTab] = useState('strategy');

  // Refs para PDF
  const strategyRef = useRef(null);
  const assetsRef = useRef(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // === PRESETS ===
  const loadPreset = () => {
    setFormData({
      productName: "Churn Buster AI",
      description: "Plataforma que identifica clientes em risco 3 meses antes e sugere playbooks de retenção.",
      stage: "Produto Maduro",
      businessType: "B2B Enterprise",
      persona: "Head de Customer Success",
      pricing: "R$ 5k/mês + Variável",
      comp1: "Gainsight",
      comp2: "ChurnZero",
      comp3: "Planilhas Excel",
      urgency: "Aumento de Churn pós-pandemia",
      ticketVal: "5000"
    });
    setShowPresets(false);
  };

  // === PDF GENERATOR ===
  const downloadPDF = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element || !window.html2pdf) return;
    const opt = {
      margin: 0.5,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().from(element).set(opt).save();
  };

  // === HANDLERS ===
  const validateStep = (step) => {
    const newErrors = {};
    const req = (f) => !formData[f] && (newErrors[f] = true);
    
    if (step === 1) { req('productName'); req('description'); }
    if (step === 2) { req('persona'); }
    if (step === 3) { req('pricing'); }
    if (step === 4) { req('comp1'); }
    if (step === 5) { req('urgency'); }
    
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

  const handleSaveKeys = (key) => {
    setApiKey(key);
    localStorage.setItem('gtm_gemini_key', key);
    setShowApiKeyModal(false);
  };

  // === PIPELINE CORE ===
  const runGTMPipeline = async () => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    
    setStatus('processing');
    setPipelineStep(1);
    setStatusMessage('🕵️ 1/3 Market Intel (Web Search)...');
    setErrorMsg('');
    
    try {
        // --- 1. MARKET INTEL ---
        const intelPrompt = `Analise o mercado BR para ${formData.productName}. Competidores: ${formData.comp1}, ${formData.comp2}. Persona: ${formData.persona}. Liste 3 tendências e 3 gaps de mercado. Resuma em JSON: { "trends": [], "gaps": [], "market_sentiment": "" }`;
        
        try {
          const intelRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: intelPrompt }] }],
              generationConfig: { responseMimeType: "application/json" },
              // tools: [{ googleSearch: {} }] // Descomente se sua chave tiver acesso a Search
            })
          });
          const intelData = await intelRes.json();
          setMarketIntel(cleanJSON(intelData.candidates?.[0]?.content?.parts?.[0]?.text));
        } catch (e) {
          console.warn("Intel fallback", e);
          setMarketIntel({ trends: ["Tendência de IA", "Automação"], gaps: ["Falta de personalização"] });
        }

        // --- 2. STRATEGY CORE ---
        setPipelineStep(2);
        setStatusMessage('🧠 2/3 Processando GTM Strategy...');
        
        const strategyPrompt = `
          Você é um VP de Marketing. Gere estratégia GTM para:
          Produto: ${formData.productName}
          Descrição: ${formData.description}
          Persona: ${formData.persona}
          Preço: ${formData.pricing}
          Concorrentes: ${formData.comp1}, ${formData.comp2}
          Urgência: ${formData.urgency}
          
          RETORNE JSON:
          {
            "gtm_thesis": {
              "enemy": "O Inimigo (Status Quo)",
              "why_now": "Por que agora?",
              "core_belief": "Crença contra-intuitiva"
            },
            "strategic_thesis": {
              "positioning": { "category": "Categoria", "unique_value": "Diferencial Único" },
              "value_proposition": { "head": "Headline", "sub": "Subheadline" }
            },
            "gtm_strategy_doc": "# Estratégia GTM\\n\\n## 1. Posicionamento\\nTexto detalhado aqui..."
          }
        `;

        const coreRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: strategyPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        const coreData = await coreRes.json();
        setStrategyCore(cleanJSON(coreData.candidates?.[0]?.content?.parts?.[0]?.text));

        // --- 3. ASSETS ---
        setPipelineStep(3);
        setStatusMessage('⚔️ 3/3 Gerando Assets Táticos...');

        const battlePrompt = `Gere Battlecards JSON para ${formData.productName} vs ${formData.comp1}. JSON: { "status_quo": { "enemy": "Inércia", "why_fail": "Risco" }, "main_competitor": { "competitor": "${formData.comp1}", "weakness": "Ponto fraco", "kill_shot": "Argumento matador" } }`;
        const msgPrompt = `Gere Messaging JSON: { "elevator_pitch": "Pitch de 30s", "objections": [{"obj": "Objeção", "ans": "Resposta"}] }`;

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

        setStatus('success');
        setStatusMessage('✅ Estratégia Pronta!');
      
    } catch (e) {
      console.error(e);
      setStatus('error');
      setErrorMsg("Erro na API. Verifique a chave ou tente novamente.");
    }
  };

  // === RENDER ===
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER */}
      <header className={`h-16 border-b flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold"><Zap size={20}/></div>
          <span className="font-bold text-lg tracking-tight">GTM StrategyOS <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-2 uppercase font-bold">Pro</span></span>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowPresets(!showPresets)} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-slate-100 transition-colors">
             <Layers size={14} className="text-slate-500"/> Presets
           </button>
           {showPresets && (
             <div className="absolute top-16 right-20 bg-white border shadow-xl rounded-lg p-2 w-48 z-50">
               <button onClick={loadPreset} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded text-sm">Carregar Exemplo SaaS</button>
             </div>
           )}
           <button onClick={() => setShowApiKeyModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-slate-100 transition-colors">
             <Shield size={14} className="text-indigo-500"/> API Key
           </button>
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
             {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        
        {status !== 'success' ? (
        // === VIEW: INPUT WIZARD ===
        <>
            <div className="flex justify-center mb-8">
               <div className={`flex items-center gap-1 px-4 py-2 rounded-full border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <span className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"><Layout size={14}/> 1. Definição</span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-400 px-3 py-1"><BrainCircuit size={14}/> 2. Strategy Core</span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-400 px-3 py-1"><Swords size={14}/> 3. Assets</span>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* LEFT COLUMN: WIZARD */}
              <div className="lg:col-span-2">
                 <div className={`rounded-2xl shadow-sm border p-8 min-h-[500px] flex flex-col justify-between relative overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    
                    {/* Step Indicator */}
                    <div className="flex justify-between items-center mb-8">
                       <div className="flex gap-1">
                          {[1,2,3,4,5].map(s => (
                            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === currentStep ? 'w-8 bg-indigo-600' : s < currentStep ? 'w-1.5 bg-indigo-200' : 'w-1.5 bg-slate-100'}`} />
                          ))}
                       </div>
                       <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Passo {currentStep} de 5</span>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1">
                      <AnimatePresence mode='wait' custom={direction}>
                        <motion.div 
                          key={currentStep}
                          initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          {currentStep === 1 && (
                            <div className="space-y-6">
                               <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="text-amber-500"/> O que estamos vendendo?</h2>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome do Produto *</label>
                                 <input 
                                   value={formData.productName}
                                   onChange={e => setFormData({...formData, productName: e.target.value})}
                                   className={`w-full p-4 rounded-xl border outline-none transition-all ${errors.productName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                                   placeholder="Ex: SalesAI Pro"
                                 />
                               </div>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição (Job to be Done) *</label>
                                 <textarea 
                                   value={formData.description}
                                   onChange={e => setFormData({...formData, description: e.target.value})}
                                   className="w-full p-4 rounded-xl border border-slate-200 outline-none h-32 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none"
                                   placeholder="O que o produto faz e para quem?"
                                 />
                               </div>
                            </div>
                          )}

                          {currentStep === 2 && (
                            <div className="space-y-6">
                               <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="text-blue-500"/> Quem Compra?</h2>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Persona Principal *</label>
                                 <input 
                                   value={formData.persona}
                                   onChange={e => setFormData({...formData, persona: e.target.value})}
                                   className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                   placeholder="Ex: Head de Marketing"
                                 />
                               </div>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo de Negócio</label>
                                 <select value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-white">
                                   <option>B2B Enterprise</option>
                                   <option>B2B SMB</option>
                                   <option>B2C</option>
                                 </select>
                               </div>
                            </div>
                          )}

                          {currentStep === 3 && (
                             <div className="space-y-6">
                               <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="text-green-500"/> Quanto Custa?</h2>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Modelo de Preço *</label>
                                 <input 
                                   value={formData.pricing}
                                   onChange={e => setFormData({...formData, pricing: e.target.value})}
                                   className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                   placeholder="Ex: R$ 500/mês por usuário"
                                 />
                               </div>
                            </div>
                          )}

                          {currentStep === 4 && (
                             <div className="space-y-6">
                               <h2 className="text-2xl font-bold flex items-center gap-2"><Swords className="text-red-500"/> Contra Quem?</h2>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Concorrente Principal *</label>
                                 <input 
                                   value={formData.comp1}
                                   onChange={e => setFormData({...formData, comp1: e.target.value})}
                                   className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                   placeholder="Ex: Salesforce"
                                 />
                               </div>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Concorrente Secundário</label>
                                 <input 
                                   value={formData.comp2}
                                   onChange={e => setFormData({...formData, comp2: e.target.value})}
                                   className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                 />
                               </div>
                            </div>
                          )}

                          {currentStep === 5 && (
                             <div className="space-y-6">
                               <h2 className="text-2xl font-bold flex items-center gap-2"><AlertOctagon className="text-orange-500"/> Por que agora?</h2>
                               <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Urgência / Gatilho *</label>
                                 <input 
                                   value={formData.urgency}
                                   onChange={e => setFormData({...formData, urgency: e.target.value})}
                                   className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                   placeholder="Ex: Nova Lei, Queda de Vendas"
                                 />
                               </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Footer Nav */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                       <button onClick={handlePrev} disabled={currentStep === 1} className="px-4 py-2 text-slate-400 font-medium hover:text-indigo-600 disabled:opacity-30 transition-colors flex items-center gap-2"><ChevronLeft size={18}/> Anterior</button>
                       {currentStep < 5 ? (
                          <button onClick={handleNext} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">Próximo <ChevronRight size={18}/></button>
                       ) : (
                          <button onClick={runGTMPipeline} disabled={status === 'processing'} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center gap-2 w-full justify-center">
                             {status === 'processing' ? <Loader2 className="animate-spin"/> : <Zap size={18}/>} Gerar Estratégia
                          </button>
                       )}
                    </div>
                 </div>
              </div>

              {/* RIGHT COLUMN: PIPELINE STATUS */}
              <div className="lg:col-span-1">
                 <div className={`rounded-2xl shadow-sm border p-6 sticky top-24 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold flex items-center gap-2"><BrainCircuit size={18} className="text-indigo-500"/> Pipeline AI</h3>
                       <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">STATUS</span>
                    </div>

                    <div className="space-y-6 relative">
                       <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>
                       {[1, 2, 3].map((step, i) => (
                         <div key={step} className={`flex gap-4 transition-opacity ${pipelineStep >= step ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${pipelineStep > step ? 'bg-green-500 border-green-500 text-white' : pipelineStep === step ? 'bg-white border-indigo-500 text-indigo-600 animate-pulse' : 'bg-white border-slate-200 text-slate-400'}`}>{step}</div>
                            <div>
                               <h4 className="font-bold text-sm">{['MARKET INTEL', 'STRATEGY CORE', 'TACTICAL ASSETS'][i]}</h4>
                               <p className="text-xs text-slate-400 mt-1">{['Search & Trends', 'Reasoning & Positioning', 'Battlecards & Pitch'][i]}</p>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                       <div className={`rounded-lg p-3 border ${status === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                          <p className="text-xs font-medium text-center">{status === 'error' ? errorMsg : (statusMessage || "Aguardando início...")}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
        </>
        ) : (
        // === VIEW: RESULTS ===
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-center mb-6">
               <button onClick={() => setStatus('idle')} className="text-sm text-slate-400 hover:text-indigo-600 flex items-center gap-1">← Nova Estratégia</button>
               <div className="flex gap-2">
                 <button onClick={() => setActiveTab('strategy')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab==='strategy' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Estratégia</button>
                 <button onClick={() => setActiveTab('battlecards')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab==='battlecards' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>Battlecards</button>
               </div>
             </div>
             
             {/* STRATEGY TAB */}
             {activeTab === 'strategy' && strategyCore && (
               <div id="strategy-doc" className={`p-8 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-indigo-600">Strategic Thesis</h2>
                    <button onClick={() => downloadPDF('strategy-doc', 'Strategy')} className="text-slate-400 hover:text-indigo-600"><Download size={20}/></button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-sm font-bold uppercase text-slate-400 mb-2">Inimigo</h4>
                      <p className="text-lg font-medium">{strategyCore.gtm_thesis?.enemy}</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-sm font-bold uppercase text-slate-400 mb-2">Por que agora?</h4>
                      <p className="text-lg font-medium">{strategyCore.gtm_thesis?.why_now}</p>
                    </div>
                  </div>
                  <div className="prose max-w-none p-6 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{strategyCore.gtm_strategy_doc}</pre>
                  </div>
               </div>
             )}

             {/* BATTLECARDS TAB */}
             {activeTab === 'battlecards' && battlecards && (
               <div id="battlecards-doc" className={`p-8 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-red-500">Battlecards: vs {formData.comp1}</h2>
                    <button onClick={() => downloadPDF('battlecards-doc', 'Battlecards')} className="text-slate-400 hover:text-indigo-600"><Download size={20}/></button>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100">
                      <h4 className="font-bold text-red-600 mb-2">Kill Shot (Nossa Vantagem)</h4>
                      <p className="text-lg">{battlecards.main_competitor?.kill_shot || battlecards.main_competitor?.our_advantage}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded bg-white">
                         <h5 className="font-bold text-slate-400 text-xs uppercase">Ponto Fraco Deles</h5>
                         <p>{battlecards.main_competitor?.weakness}</p>
                      </div>
                      <div className="p-4 border rounded bg-white">
                         <h5 className="font-bold text-slate-400 text-xs uppercase">Status Quo Trap</h5>
                         <p>{battlecards.status_quo?.enemy}</p>
                      </div>
                    </div>
                  </div>
               </div>
             )}
        </div>
        )}
      </main>

      {/* API MODAL */}
      <AnimatePresence>
        {showApiKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 flex gap-2 items-center"><Shield className="text-indigo-600"/> Configurar API</h3>
              <p className="text-sm text-slate-500 mb-4">Sua chave é salva localmente no navegador.</p>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Cole sua chave AIza..." className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"/>
              <div className="flex gap-2">
                <button onClick={() => setShowApiKeyModal(false)} className="flex-1 text-slate-500 py-3">Cancelar</button>
                <button onClick={() => handleSaveKeys(apiKey)} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Salvar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default GTMCopilot;
