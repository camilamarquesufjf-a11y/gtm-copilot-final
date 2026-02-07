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
const GEMINI_MODEL = "gemini-2.0-flash-exp"; 

// === FRAMER MOTION VARIANTS ===
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const wizardVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    scale: 0.95
  })
};

const fieldLabels = {
  productName: "Nome do Produto",
  description: "Descrição",
  stage: "Estágio",
  persona: "Persona",
  pricing: "Precificação",
  churnRate: "Churn Rate",
  comp1: "Competidor Principal",
  urgency: "Urgência"
};

const GTMCopilot = () => {
  // UI States
  const [activeTab, setActiveTab] = useState('input');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  
  // API Keys
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gtm_gemini_key') || '');
  const [perplexityApiKey, setPerplexityApiKey] = useState(() => localStorage.getItem('gtm_pplx_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState({});

  // Form Data
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    stage: '',
    businessType: 'B2B',
    accountSize: '',
    persona: '',
    numCustomers: '',
    pricing: '',
    ticketVal: '',
    churnRate: '15',
    nrrTarget: '110',
    gtmMotion: '',
    comp1: '',
    comp2: '',
    comp3: '',
    whereLose: '',
    urgency: '',
    timeline: '',
    riskCustomers: '', 
    tamRisk: 0, 
    audience: '', 
    competitors: '',
    pain: '',
  });

  const criticalFields = ['productName', 'description', 'stage', 'persona', 'pricing', 'churnRate', 'comp1', 'urgency'];

  const isPipelineReady = () => {
    return criticalFields.every(field => formData[field] && formData[field].toString().trim() !== '');
  };

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

  useEffect(() => {
    const savedTheme = localStorage.getItem('gtm_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (status === 'idle' && activeTab === 'input' && currentStep === 5) runGTMPipeline();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);

    const savedForm = localStorage.getItem('gtm_formData');
    if (savedForm) {
       try { setFormData(prev => ({...prev, ...JSON.parse(savedForm)})); } catch(e){}
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.removeChild(script);
    };
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

  const validateStep = (step) => {
    const newErrors = {};
    const check = (field) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = true;
      }
    };

    if (step === 1) { check('productName'); check('description'); }
    if (step === 2) { check('persona'); }
    if (step === 3) { check('pricing'); }
    if (step === 4) { check('comp1'); }
    if (step === 5) { check('urgency'); }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
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

  const loadPreset = (preset) => {
    if (preset === 'churn') {
      setFormData({
        ...formData,
        productName: "Churn Buster AI",
        description: "Plataforma que identifica clientes em risco 3 meses antes e sugere playbooks de retenção.",
        stage: "Redução de Churn",
        businessType: "B2B",
        accountSize: "Mid-market",
        persona: "Head de Customer Success",
        numCustomers: 150,
        pricing: "R$ 5k/mês",
        ticketVal: 5000,
        churnRate: 20,
        nrrTarget: 115,
        gtmMotion: "Sales-led",
        comp1: "Gainsight",
        comp2: "ChurnZero",
        comp3: "Planilhas",
        whereLose: "Complexidade de setup e preço alto do Gainsight.",
        urgency: "Kill Revenue (Crítico)",
        timeline: "Q1 deste ano",
        riskCustomers: 30
      });
      setErrors({});
    }
    setShowPresets(false);
  };

  const handleCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error(err); }
    document.body.removeChild(textArea);
  };

  const downloadPDF = async (tabName, ref) => {
    if (!ref.current || !window.html2pdf) {
      alert("Aguarde o carregamento do gerador de PDF ou recarregue a página.");
      return;
    }
    const opt = {
      margin: 0.5,
      filename: `${formData.productName.replace(/\s+/g, '_')}_${tabName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().from(ref.current).set(opt).save();
  };

  const cleanJSON = (text) => {
    if (!text) return null;
    let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
    try { return JSON.parse(clean); } 
    catch (e) { 
      const sanitized = clean.replace(/[\u0000-\u001F]+/g, ' '); 
      try { return JSON.parse(sanitized); } catch (e2) { return null; }
    }
  };

  const handleSaveKeys = (newGeminiKey, newPplxKey) => {
    setApiKey(newGeminiKey);
    setPerplexityApiKey(newPplxKey);
    localStorage.setItem('gtm_gemini_key', newGeminiKey);
    localStorage.setItem('gtm_pplx_key', newPplxKey);
    setShowApiKeyModal(false); 
  };

  const runGTMPipeline = async () => {
    if (!apiKey) {
      setStatus('error');
      setErrorMsg("Chave da API do Google Gemini não configurada.");
      setShowApiKeyModal(true);
      return;
    }

    if (!isPipelineReady()) {
      setErrorMsg("⚠️ Preencha todos os campos obrigatórios");
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
      try {
        const intelPrompt = `Faça uma análise de mercado BR 2026 para ${formData.productName}.\nContexto:\n- Competidores: ${formData.comp1}, ${formData.comp2}, ${formData.comp3}\n- Persona: ${formData.persona}\n- Mercado: ${formData.businessType}\n- Descrição: ${formData.description}\n\nPesquise informações atualizadas na web e responda em 200 palavras:\n1. Tendências de mercado BR 2026\n2. Análise competitiva\n3. Gaps e oportunidades`;

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
        
        if (intelText) {
          setPerplexityIntel({ insight: intelText });
        } else {
          throw new Error('Intel vazio');
        }
      } catch (intelErr) {
        console.warn('Intel fallback');
        setPerplexityIntel({ insight: `Análise Contextual: ${formData.productName} compete no mercado ${formData.businessType}.` });
      }

      setPipelineStep(2);
  
      // 2. STRATEGY
      setStatusMessage('🧠 2/4 Strategy Core...');
      const strategyPrompt = `Você é um PMM Sênior. Gere estratégia GTM para:${JSON.stringify(formData)}\nRETORNE APENAS UM JSON VÁLIDO:\n{\n  "gtm_thesis": {\n    "enemy": "Inimigo/Status Quo",\n    "tension": "Dor aguda",\n    "why_now": "Por que agora"\n  },\n  "primary_gtm_decision": {\n    "primary_target_customer": "Persona detalhada",\n    "primary_use_case": "Caso de uso",\n    "dominant_value": "Valor principal"\n  },\n  "strategic_thesis": {\n    "positioning": {\n      "category": "Categoria",\n      "unique_value": "Diferencial"\n    },\n    "value_proposition": {\n      "core_promise": "Promessa"\n    }\n  },\n  "gtm_strategy_doc": "# Estratégia GTM\\nTexto markdown completo..."\n}`;
  
      const coreRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: strategyPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const coreData = await coreRes.json();
      setStrategyCore(cleanJSON(coreData.candidates?.[0]?.content?.parts?.[0]?.text));
  
      // 3. ASSETS
      setPipelineStep(3);
      setStatusMessage('⚔️ 3/4 Assets Táticos...');
  
      const battlePrompt = `Battlecards JSON para ${formData.productName} vs ${formData.comp1}.\nRETORNE JSON:\n{\n  "status_quo": {\n    "enemy": "Inércia",\n    "why_it_feels_safe": "Segurança",\n    "why_it_fails": "Falha",\n    "our_counter": "Contra"\n  },\n  "main_competitor": {\n    "competitor": "${formData.comp1}",\n    "their_strength": "Força",\n    "their_blind_spot": "Ponto cego",\n    "our_advantage": "Vantagem"\n  },\n  "objection_handling": [\n    { "objection": "Obj1", "answer": "Resp1" }\n  ]\n}`;
      const msgPrompt = `Messaging JSON para ${formData.productName}.\nRETORNE JSON:\n{\n  "core_message": "Mensagem central",\n  "sub_headline": "Subtitulo",\n  "problem_statement": "Problema",\n  "solution_statement": "Solução",\n  "value_pillars": [\n    { "pillar": "Pilar1", "proof": "Prova1" }\n  ]\n}`;
  
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
      setStatusMessage('✅ GTM Pack Completo!');
      setActiveTab('strategy');
      
    } catch (err) {
      console.error('Pipeline Error:', err);
      setStatus('error');
      setErrorMsg(`Erro: ${err.message}`);
    }
  };

  const inputErrorClass = "border-red-500 ring-2 ring-red-500/20 animate-shake";
  const inputNormalClass = (darkMode) => darkMode ? 'border-slate-600 focus:ring-2 focus:ring-indigo-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
       <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      {/* HEADER */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none">GTM StrategyOS <span className="text-indigo-500 text-xs align-top">PRO</span></h1>
              <span className={`text-[10px] font-medium tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {formData.productName || 'Novo Projeto'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
              <Server size={12} /> Live APIs
            </div>
            <button onClick={() => setShowApiKeyModal(true)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              <Shield className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={() => setShowPresets(!showPresets)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <Layers size={14} /> Presets
              </button>
              {showPresets && (
                <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-xl border p-1 z-50 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <button onClick={() => loadPreset('churn')} className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                    <TrendingUp size={14} className="text-emerald-500"/> Churn Buster
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex justify-center mb-10">
          <div className={`p-1.5 rounded-2xl border shadow-sm inline-flex items-center gap-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            {[{ id: 'input', label: '1. Definição', icon: Layout }, { id: 'strategy', label: '2. Strategy Core', icon: Target, disabled: !strategyCore }, { id: 'assets', label: '3. Ativos Táticos', icon: Swords, disabled: !battlecards }].map((tab) => (
              <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)} disabled={tab.disabled} className={`relative px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? 'text-white shadow-md' : tab.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'} ${activeTab === tab.id ? 'bg-indigo-600' : isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute inset-0 bg-indigo-600 rounded-xl -z-10" />}
                <tab.icon size={16} />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className={activeTab === 'input' ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <AnimatePresence mode="wait">
              {activeTab === 'input' && (
                <motion.div key="wizard" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="space-y-6">
                  
                  {/* PROGRESS */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(step => (
                          <div key={step} className={`h-2 rounded-full transition-all duration-500 ${step === currentStep ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : step < currentStep ? 'w-2 bg-indigo-500' : `w-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-50">Passo {currentStep} de 5</span>
                    </div>

                    {Object.keys(errors).length > 0 && (
                      <div ref={errorRef} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2"><AlertOctagon size={18}/> <span>Campos obrigatórios:</span></div>
                        <div className="flex flex-wrap gap-2">{Object.keys(errors).map(field => (<span key={field} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">{fieldLabels[field] || field}</span>))}</div>
                      </div>
                    )}

                    <div className="relative overflow-hidden min-h-[400px]">
                      <AnimatePresence custom={direction} mode="wait">
                        <motion.div key={currentStep} custom={direction} variants={wizardVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 w-full h-full flex flex-col justify-between">
                          
                          {/* STEP 1 */}
                          {currentStep === 1 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="text-amber-500" /> O que estamos vendendo?</h2>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Nome do Produto *</label>
                                  <input name="productName" value={formData.productName} onChange={e=>setFormData({...formData, productName: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all ${errors.productName ? inputErrorClass : inputNormalClass(isDarkMode)}`} placeholder="Ex: SaaS Analytics Pro" />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Descrição *</label>
                                  <textarea name="description" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent h-32 resize-none outline-none transition-all ${errors.description ? inputErrorClass : inputNormalClass(isDarkMode)}`} placeholder="O que ele resolve?" />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Estágio Atual *</label>
                                  <select name="stage" value={formData.stage} onChange={e=>setFormData({...formData, stage: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {["Novo Produto", "Lançamento de Funcionalidade", "Pivot de Preços", "Redução de Churn"].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 2 */}
                          {currentStep === 2 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="text-blue-500" /> ICP & Persona</h2>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Persona Principal *</label>
                                  <input name="persona" value={formData.persona} onChange={e=>setFormData({...formData, persona: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all ${errors.persona ? inputErrorClass : inputNormalClass(isDarkMode)}`} placeholder="Ex: VP de Vendas" />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Tipo de Negócio</label>
                                  <select value={formData.businessType} onChange={e=>setFormData({...formData, businessType: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option>B2B</option><option>B2C</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 3 */}
                          {currentStep === 3 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="text-emerald-500" /> Dados Comerciais</h2>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Precificação *</label>
                                  <input name="pricing" value={formData.pricing} onChange={e=>setFormData({...formData, pricing: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all ${errors.pricing ? inputErrorClass : inputNormalClass(isDarkMode)}`} placeholder="Ex: R$ 500/mês" />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Churn Anual (%)</label>
                                  <input type="number" value={formData.churnRate} onChange={e=>setFormData({...formData, churnRate: e.target.value})} className={`w-full p-3 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Meta NRR (%)</label>
                                  <input type="number" value={formData.nrrTarget} onChange={e=>setFormData({...formData, nrrTarget: e.target.value})} className={`w-full p-3 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 4 */}
                          {currentStep === 4 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><Swords className="text-red-500" /> Competição</h2>
                              <div className="space-y-4">
                                <div>
                                   <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Competidores *</label>
                                   <input name="comp1" value={formData.comp1} onChange={e=>setFormData({...formData, comp1: e.target.value})} placeholder="Competidor 1" className={`w-full p-4 rounded-xl border bg-transparent outline-none mb-2 ${errors.comp1 ? inputErrorClass : inputNormalClass(isDarkMode)}`} />
                                   <input value={formData.comp2} onChange={e=>setFormData({...formData, comp2: e.target.value})} placeholder="Competidor 2" className={`w-full p-4 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Onde perdemos?</label>
                                  <textarea value={formData.whereLose} onChange={e=>setFormData({...formData, whereLose: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent h-24 outline-none ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 5 */}
                          {currentStep === 5 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><AlertOctagon className="text-purple-500" /> Urgência & Risco</h2>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Nível de Urgência *</label>
                                  <select name="urgency" value={formData.urgency} onChange={e=>setFormData({...formData, urgency: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none ${errors.urgency ? inputErrorClass : isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {["Kill Revenue (Crítico)", "Important", "Nice to Have"].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Cronograma</label>
                                  <select value={formData.timeline} onChange={e=>setFormData({...formData, timeline: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {["Próximos 30 dias", "60-90 dias", "Q1 deste ano", "Q2-Q4"].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className={`mt-6 pt-6 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      <button onClick={handlePrev} disabled={currentStep === 1} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentStep === 1 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                        <ChevronLeft size={16}/> Anterior
                      </button>
                      
                      {currentStep < 5 ? (
                        <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all">
                          Próximo <ChevronRight size={16}/>
                        </button>
                      ) : (
                         <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800 animate-pulse">
                           <CheckCircle size={16}/> Pronto
                         </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* SIDEBAR */}
          {activeTab === 'input' && (
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <div className={`rounded-2xl shadow-xl overflow-hidden border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                 <div className={`p-5 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><h3 className="font-bold flex items-center gap-2 text-sm"><BrainCircuit size={16} className="text-indigo-500"/> Pipeline AI</h3><span className="text-[10px] font-bold uppercase tracking-wider opacity-50">{status === 'idle' ? 'Aguardando' : status}</span></div>
                 <div className="p-5 space-y-6 relative">
                   <div className={`absolute left-9 top-8 bottom-8 w-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                   {[1, 2, 3].map((step) => (<div key={step} className="relative z-10 flex items-start gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-500 ${pipelineStep > step ? 'bg-emerald-500 text-white scale-110' : pipelineStep === step ? 'bg-indigo-500 text-white animate-pulse' : isDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>{pipelineStep > step ? <CheckCircle size={14} /> : step}</div><div className={`transition-opacity duration-500 ${pipelineStep >= step ? 'opacity-100' : 'opacity-40'}`}><p className="text-xs font-bold uppercase tracking-wider mb-0.5">{['Market Intel', 'Strategy Core', 'Assets'][step-1]}</p></div></div>))}
                 </div>
                 <div className={`p-5 border-t ${isDarkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <button onClick={runGTMPipeline} disabled={status === 'processing' || !isPipelineReady()} className={`w-full py-4 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isPipelineReady() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>{status === 'processing' ? <Loader2 className="animate-spin"/> : 'Gerar Estratégia'}</button>
                    {!isPipelineReady() && <p className="text-[10px] text-center mt-3 text-red-500 opacity-80 flex items-center justify-center gap-1"><AlertCircle size={10}/> Complete o passo 5</p>}
                 </div>
              </div>
              {perplexityIntel && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 opacity-60"><Globe size={14}/> Intel Resumo</h4><p className="text-xs leading-relaxed opacity-80 line-clamp-4">{perplexityIntel.insight}</p></motion.div>
              )}
            </div>
          )}

          {/* RESULTS */}
          <div className="lg:col-span-12">
            <AnimatePresence>
              {activeTab === 'strategy' && strategyCore && (
                <motion.div key="strategy" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="space-y-8">
                  <div className={`flex justify-between items-center p-4 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => setActiveTab('input')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"><ArrowLeft size={16}/> Voltar</button>
                    <button onClick={() => downloadPDF('Strategy', strategyRef)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700"><Download size={16}/> PDF</button>
                  </div>
                  <div ref={strategyRef} className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <h2 className="text-3xl font-extrabold mb-4">"{strategyCore.gtm_thesis.enemy}"</h2>
                    <p className="text-lg text-slate-500 mb-8">{strategyCore.gtm_thesis.tension}</p>
                    <div className="prose max-w-none whitespace-pre-wrap font-mono text-sm opacity-80">{strategyCore.gtm_strategy_doc}</div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'assets' && battlecards && (
                <motion.div key="assets" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="space-y-8">
                  <div className={`flex justify-between items-center p-4 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => setActiveTab('strategy')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"><ArrowLeft size={16}/> Strategy</button>
                    <button onClick={() => downloadPDF('Assets', assetsRef)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700"><Download size={16}/> PDF</button>
                  </div>
                  <div ref={assetsRef} className={`p-10 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-3xl font-extrabold mb-4">{messaging.core_message}</h3>
                    <div className="grid md:grid-cols-2 gap-8"><div className="p-6 border rounded-2xl"><h4 className="font-bold mb-2">Problema</h4><p>{messaging.problem_statement}</p></div><div className="p-6 border rounded-2xl"><h4 className="font-bold mb-2">Solução</h4><p>{messaging.solution_statement}</p></div></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* MODAL API */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500" /> Configurar APIs</h3><button onClick={() => setShowApiKeyModal(false)}><XCircle className="w-6 h-6 text-slate-400" /></button></div>
              <div className="space-y-4">
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Gemini API Key" className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                <button onClick={() => handleSaveKeys(apiKey, perplexityApiKey)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex justify-center items-center gap-2"><CheckCircle className="w-5 h-5" /> Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GTMCopilot;
          
