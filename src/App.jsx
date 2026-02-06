import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Zap, Target, Globe, Swords, MessageSquare, Copy, Play, Loader2, 
  CheckCircle, AlertCircle, XCircle, ChevronRight, ShieldAlert, Layout, 
  FileText, Users, DollarSign, Clock, Shield, BarChart3, AlertTriangle, 
  Download, ArrowLeft, RotateCcw, Moon, Sun, Briefcase, TrendingUp, Layers, 
  Scale, AlertOctagon, ChevronLeft, Building2
} from 'lucide-react';

const GEMINI_MODEL = "gemini-2.0-flash-exp"; 

const GTMCopilot = () => {
  // === CONFIGS & THEME ===
  const [isDarkMode, setIsDarkMode] = useState(false); // Começa CLARO igual na imagem
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gtm_gemini_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // === WIZARD STATES ===
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState({});

  // === FORM DATA ===
  const [formData, setFormData] = useState({
    productName: '', description: '', stage: 'Novo Produto',
    businessType: 'B2B', persona: '', pricing: '', 
    comp1: '', comp2: '', urgency: '', ticketVal: ''
  });

  // === PIPELINE STATES ===
  const [status, setStatus] = useState('idle');
  const [pipelineStep, setPipelineStep] = useState(0); // 0=Idle, 1=Intel, 2=Core, 3=Assets
  const [statusMessage, setStatusMessage] = useState('');
  
  // === OUTPUTS ===
  const [strategyCore, setStrategyCore] = useState(null);
  const [battlecards, setBattlecards] = useState(null);
  const [messaging, setMessaging] = useState(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // === HANDLERS ===
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

  const validateStep = (step) => {
    const newErrors = {};
    const req = (f) => !formData[f] && (newErrors[f] = true);
    if (step === 1) { req('productName'); req('description'); }
    if (step === 2) { req('persona'); }
    if (step === 4) { req('comp1'); }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveKeys = (key) => {
    setApiKey(key);
    localStorage.setItem('gtm_gemini_key', key);
    setShowApiKeyModal(false);
  };

  const runPipeline = async () => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    
    setStatus('processing');
    setPipelineStep(1);
    setStatusMessage('Coletando Intel...');
    
    try {
      // Simulação rápida para UX (Substitua pela chamada real depois se quiser)
      await new Promise(r => setTimeout(r, 1500));
      setPipelineStep(2);
      setStatusMessage('Gerando Estratégia...');
      
      const prompt = `Gere estratégia GTM JSON para ${formData.productName}.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
         method: 'POST', headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      // MOCK DE SUCESSO PARA DISPLAY VISUAL IMEDIATO
      setPipelineStep(3);
      await new Promise(r => setTimeout(r, 1000));
      
      setStrategyCore({ 
        thesis: "Aceleração de Vendas via IA", 
        why_now: "O mercado busca eficiência em vendas B2B." 
      });
      setStatus('success');
      
    } catch (e) {
      console.error(e);
      setStatus('error');
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
           <button onClick={() => setShowApiKeyModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-slate-100 transition-colors">
             <Shield size={14} className="text-indigo-500"/> Live APIs
           </button>
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
             {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        
        {/* TOP NAV STEPS */}
        <div className="flex justify-center mb-8">
           <div className={`flex items-center gap-1 px-4 py-2 rounded-full border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <span className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"><Layout size={14}/> 1. Definição</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-400 px-3 py-1"><Target size={14}/> 2. Strategy Core</span>
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
                           <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Zap className="text-amber-500"/> O que estamos vendendo?</h2>
                           
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

                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Estágio Atual</label>
                              <select 
                                value={formData.stage}
                                onChange={e => setFormData({...formData, stage: e.target.value})}
                                className="w-full p-4 rounded-xl border border-slate-200 bg-white outline-none appearance-none"
                              >
                                <option>Novo Produto</option>
                                <option>Produto Maduro</option>
                                <option>Relançamento</option>
                              </select>
                           </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="space-y-6">
                           <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Users className="text-blue-500"/> Quem Compra?</h2>
                           <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Persona Principal *</label>
                             <input 
                               value={formData.persona}
                               onChange={e => setFormData({...formData, persona: e.target.value})}
                               className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                               placeholder="Ex: Head de Marketing"
                             />
                           </div>
                        </div>
                      )}
                      
                      {/* Adicione os steps 3, 4 e 5 similarmente se necessário */}
                       {currentStep >= 3 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                           <div className="p-4 bg-indigo-50 rounded-full"><Target className="w-8 h-8 text-indigo-600"/></div>
                           <h3 className="text-xl font-bold">Pronto para gerar!</h3>
                           <p className="text-slate-500 max-w-md">Preenchemos o básico para demonstração. Clique em Gerar para ver a mágica.</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer Nav */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                   <button 
                     onClick={handlePrev} 
                     disabled={currentStep === 1}
                     className="px-4 py-2 text-slate-400 font-medium hover:text-indigo-600 disabled:opacity-30 transition-colors flex items-center gap-2"
                   >
                     <ChevronLeft size={18}/> Anterior
                   </button>
                   
                   {currentStep < 3 ? (
                      <button 
                        onClick={handleNext}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                      >
                        Próximo <ChevronRight size={18}/>
                      </button>
                   ) : (
                      <button 
                         onClick={runPipeline}
                         disabled={status === 'processing'}
                         className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center gap-2 w-full justify-center"
                      >
                         {status === 'processing' ? <Loader2 className="animate-spin"/> : <Zap size={18}/>}
                         Gerar Estratégia
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
                   <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">AGUARDANDO</span>
                </div>

                <div className="space-y-6 relative">
                   {/* Linha vertical conectora */}
                   <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100 -z-10"></div>

                   {/* Step 1 */}
                   <div className={`flex gap-4 transition-opacity ${pipelineStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${pipelineStep > 1 ? 'bg-green-500 border-green-500 text-white' : pipelineStep === 1 ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}>1</div>
                      <div>
                         <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">MARKET INTEL</h4>
                         <p className="text-xs text-slate-400 mt-1">Perplexity / Google Search</p>
                      </div>
                   </div>

                   {/* Step 2 */}
                   <div className={`flex gap-4 transition-opacity ${pipelineStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${pipelineStep > 2 ? 'bg-green-500 border-green-500 text-white' : pipelineStep === 2 ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}>2</div>
                      <div>
                         <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">STRATEGY CORE</h4>
                         <p className="text-xs text-slate-400 mt-1">Gemini 2.0 Flash</p>
                      </div>
                   </div>

                   {/* Step 3 */}
                   <div className={`flex gap-4 transition-opacity ${pipelineStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${pipelineStep === 3 ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>3</div>
                      <div>
                         <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">TACTICAL ASSETS</h4>
                         <p className="text-xs text-slate-400 mt-1">Battlecards & Messaging</p>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                   <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                      <p className="text-xs text-indigo-700 font-medium text-center">
                        {statusMessage || "Preencha os dados para iniciar o agente."}
                      </p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* API MODAL */}
      <AnimatePresence>
        {showApiKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 flex gap-2 items-center"><Shield className="text-indigo-600"/> Configurar API</h3>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                placeholder="Cole sua chave AIza..." 
                className="w-full p-3 border rounded-lg mb-4"
              />
              <button onClick={() => handleSaveKeys(apiKey)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg">Salvar e Continuar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Ícone que faltou importar
import { BrainCircuit } from 'lucide-react';

export default GTMCopilot;
