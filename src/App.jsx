import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Target, Globe, Swords, MessageSquare, Copy, Play, Loader2, 
  CheckCircle, AlertCircle, XCircle, ChevronRight, ShieldAlert, Zap, Layout, 
  FileText, Users, DollarSign, Clock, Shield, BarChart3, AlertTriangle, 
  Download, ArrowLeft, ArrowRight, RotateCcw, Moon, Sun,
  Keyboard, Share2, Briefcase, TrendingUp, Layers, UserCheck, Scale, AlertOctagon,
  ChevronLeft, Building2, User, Server, Database, Lock,
  ExternalLink, Terminal, Activity, Check
} from 'lucide-react';

/**
 * ==============================================================================
 * MÓDULO 1: CONFIGURAÇÃO & CONSTANTES
 * ==============================================================================
 */
const CONFIG = {
  GEMINI_MODEL: "gemini-2.5-flash-preview-09-2025",
  STORAGE_KEYS: {
    THEME: 'gtm_theme_v2',
    FORM: 'gtm_form_v2',
    API_GEMINI: 'gtm_key_gemini',
  },
  CRITICAL_FIELDS: ['productName', 'description', 'stage', 'persona', 'pricing', 'churnRate', 'comp1', 'urgency'],
  WIZARD_STEPS: [
    { id: 1, title: "Produto & Visão", icon: Zap },
    { id: 2, title: "ICP & Persona", icon: UserCheck },
    { id: 3, title: "Comercial", icon: DollarSign },
    { id: 4, title: "Concorrência", icon: Swords },
    { id: 5, title: "Prioridade & Risco", icon: AlertOctagon }
  ]
};

/**
 * ==============================================================================
 * MÓDULO 2: PROMPTS ENTERPRISE (GOOGLE SEARCH + JSON FORÇADO)
 * ==============================================================================
 */
const PROMPTS = {
  INTEL: (context) => `YOU ARE: Senior Market Intelligence Analyst
MISSION: Validate GTM assumptions using Google Search for RECENT data (2025-2026)
TOOL: You MUST use Google Search to validate facts
CONTEXT:
- Product: ${context.productName}
- Description: ${context.description}
- Market: ${context.businessType} / ${context.accountSize}
- Competitors: ${context.comp1}, ${context.comp2}

⚠️ META-INSTRUCTION: The example JSON below shows STRUCTURE and FORMAT only.
You MUST replace all bracketed placeholders [LIKE_THIS] with REAL DATA from Google Search.
NEVER copy specific numbers, company names, or facts from the example.

CRITICAL INSTRUCTION: Your response must be ONLY valid JSON. No explanations before or after.
Start your response with { and end with }

REQUIRED JSON OUTPUT STRUCTURE:
{
  "market_intel": {
    "claims": [
      {
        "claim_id": "C1",
        "type": "competitor",
        "statement": "[REAL_COMPETITOR_NAME como ${context.comp1}] possui [REAL_NUMBER encontrado no Google] [usuários/clientes/etc] (crescimento de [REAL_%] YoY desde [BASELINE_REAL] em [YEAR_REAL]), segundo [SOURCE_REAL]. [Adicione 1-2 fatos específicos sobre features/diferenciais encontrados na busca].",
        "source_name": "[Nome real da fonte que você encontrou]",
        "source_url": "[URL real encontrado no Google ou null se não disponível]",
        "retrieved_at": "2026-02-09",
        "confidence": [0.4 a 0.9 baseado na qualidade da fonte]
      }
    ],
    "notes_on_gaps": ["Liste dados que você procurou mas NÃO encontrou"]
  }
}

QUALITY STANDARDS (use these as guidelines, not templates to copy):
✅ Include: specific numbers, percentages, timeframes, named sources
✅ Focus on: ${context.productName}, ${context.comp1}, ${context.businessType} market
✅ Prefer: government data, industry reports, official company releases
✅ Avoid: vague generalities, unsourced claims, old data (pre-2025)

FORMAT EXAMPLES (showing structure - DO NOT copy content):
Topic: [Hypothetical Fintech]
"A [Company X] cresceu [Y%] em 2025 (de [A] para [B] usuários), segundo [Source], oferecendo [Feature 1] e [Feature 2]."

Topic: [Hypothetical SaaS]
"O mercado de [Industry] no Brasil atingiu R$[X]B em 2025 (crescimento de [Y%] vs [Z]B em 2024), segundo [Research Firm]."

NOW EXECUTE:
1. Use Google Search to find 3-4 REAL facts about:
   - ${context.comp1} (competitor data: users, market share, key features)
   - ${context.businessType} market trends in Brazil (2025-2026)
   - Economic/macro factors relevant to ${context.productName}
2. Generate JSON with REAL data (not placeholders, not example content)
3. Types: competitor, trend, macro, pricing
4. RETURN ONLY JSON - NO MARKDOWN, NO EXPLANATIONS
Execute Google Search now and return JSON.`,

  STRATEGY: (context, intel) => `YOU ARE: VP of Go-to-Market Strategy
MISSION: Generate battle plan with QUANTIFIED decisions based on ${context.productName}
INPUTS:
Product: ${context.productName}
Persona: ${context.persona}
Pricing: ${context.pricing}
Main Competitor: ${context.comp1}
Urgency: ${context.urgency}
Churn Rate: ${context.churnRate}%
VALIDATED INTEL (from Google Search):
${JSON.stringify(intel?.market_intel?.claims || [], null, 2)}
⚠️ META-INSTRUCTION: The JSON structure below contains PLACEHOLDERS in [BRACKETS].
You MUST replace ALL placeholders with content SPECIFIC to ${context.productName}.
NEVER copy example calculations, company names, or strategies verbatim.
ALWAYS derive insights from the VALIDATED INTEL above and ${context} inputs.

GATING RULES:
1. Identify critical unknowns specific to ${context.productName}
2. Calculate unknowns_ratio = (high-impact unknowns / 8)
3. IF ratio > 0.30 → set "strategy_allowed": false

CRITICAL INSTRUCTION: Your response must be ONLY valid JSON. No text before or after.

REQUIRED JSON STRUCTURE (replace ALL [PLACEHOLDERS]):
{
  "decision_layer": {
    "context_summary": "[Escreva 2-3 frases conectando dados do INTEL com oportunidade de ${context.productName}. Mencione números específicos do intel.]",
    "unknowns": [
      {
        "field": "[Específico para ${context.productName}, ex: viabilidade do modelo de preço de ${context.pricing}]",
        "impact": "High/Medium/Low",
        "mitigation": "[Ação concreta para reduzir unknow]"
      }
    ],
    "unknowns_ratio": [Calcule: número de unknowns High / 8],
    "strategy_allowed": [true se ratio ≤ 0.30, senão false],
    "critical_decisions": [
      {
        "title": "[Decisão específica para ${context.productName}]",
        "preferred_option": {
          "option": "[Ação recomendada COM números, prazos, budget estimado baseado em ${context}]",
          "confidence": [0.6 a 0.95],
          "why": "[Justificativa citando claims do INTEL com IDs: C1, C2, etc]",
          "evidence_claim_ids": ["C1", "C2"],
          "financial_implications": "[Custo estimado + retorno esperado COM cálculos]",
          "success_criteria": "[Métricas mensuráveis: X < Y, Z > W, prazo]"
        },
        "alternative_option": {
          "option": "[Alternativa viável]",
          "risk": "[Risco específico dessa escolha]",
          "when_to_consider": "[Condição trigger: 'Se X acontecer...']"
        }
      }
    ]
  },
  "alignment_layer": {
    "product_brief": "[Direção para produto específica para ${context.productName}]",
    "sales_brief": "[Pitch + objeções específicas para ${context.persona}]",
    "leadership_brief": "[Análise risco/retorno COM números]"
  },
  "strategy_layer": {
    "gtm_thesis": {
      "enemy": "[Competidor/status quo específico: ${context.comp1} ou bancões/etc]",
      "tension": "[Dor específica de ${context.persona} que ${context.productName} resolve]",
      "why_now": "[Urgência baseada em INTEL macro + gap competitivo COM dados]"
    },
    "positioning": {
      "category": "[Categoria específica onde ${context.productName} compete]",
      "unique_value": "[Diferenciação clara vs ${context.comp1}]"
    },
    "metrics": {
      "north_star": "[UMA métrica primária específica para ${context.productName}]",
      "success_metrics": [
        {"metric": "[Nome]", "target": "[Baseline → Meta]", "timeframe": "[Prazo]"}
      ]
    },
    "plan_30_60_90": {
      "days_0_30": ["[Ação 1 COM budget/meta]", "[Ação 2 COM budget/meta]", "[Ação 3]"],
      "days_31_60": ["[Ação 4]", "[Ação 5]"],
      "days_61_90": ["[Ação 6]", "[Ação 7]"]
    },
    "messaging": {
      "core_message": "[Mensagem ≤10 palavras para ${context.productName}]",
      "sub_headline": "[Submensagem]",
      "value_pillars": [
        {"pillar": "[Nome]", "proof": "[Evidência COM números]"}
      ]
    },
    "battlecards": {
      "main_competitor": {
        "competitor": "${context.comp1 || 'Líder de mercado'}",
        "their_strength": "[Força real do competidor baseada em INTEL]",
        "our_kill_point": "[Nossa vantagem COM evidências]"
      },
      "objection_handling": [
        {"objection": "[Objeção real de ${context.persona}]", "answer": "[Resposta específica]"}
      ]
    }
  }
}

CRITICAL QUALITY RULES:
✅ ALL content MUST be specific to ${context.productName}, NOT generic
✅ ALL "why" fields MUST cite intel claims (C1, C2, etc)
✅ ALL financial_implications MUST include rough calculations
✅ ALL success_criteria MUST be measurable (< > = numbers)
✅ North Star MUST be ONE clear metric (not "growth" or generic)
✅ Plan actions MUST include budget/targets when relevant
✅ Value pillars MUST have quantified proof

MINIMUM REQUIREMENTS:
- 3 critical_decisions (each with financial_implications + success_criteria)
- 3 value_pillars (each with numbers in proof)
- 5 objection_handling (realistic for ${context.persona})
- All "why" fields cite evidence_claim_ids
- If strategy_allowed = false, set strategy_layer = null

Generate strategy NOW for ${context.productName}.
RETURN ONLY JSON - NO MARKDOWN, NO EXPLANATIONS.`
Generate strategy now.`
};

/**
 * ==============================================================================
 * MÓDULO 3: SERVICES (GOOGLE SEARCH + PARSING ROBUSTO)
 * ==============================================================================
 */
const GeminiService = {
  cleanJSON: (text) => {
    if (!text) return null;
    
    // Step 1: Remove markdown blocks
    let clean = text
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .replace(/^json\n/i, '');
    
    // Step 2: Extract JSON object (find first { to last })
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    
    // Step 3: Try parse
    try {
      return JSON.parse(clean);
    } catch (e) {
      // Step 4: Aggressive cleanup
      try {
        // Remove control characters
        const sanitized = clean.replace(/[\x00-\x1F\x7F]/g, '');
        return JSON.parse(sanitized);
      } catch (e2) {
        console.error("❌ JSON Parse Failed:", e2.message);
        console.error("Text preview:", clean.substring(0, 300));
        return null;
      }
    }
  },

  validateSchema: (data, type) => {
    if (!data || typeof data !== 'object') return false;
    
    if (type === 'intel') {
      return !!(data.market_intel?.claims && Array.isArray(data.market_intel.claims));
    }
    
    if (type === 'strategy') {
      return !!(data.decision_layer && data.alignment_layer);
    }
    
    return false;
  },

  call: async (apiKey, systemPrompt, userPrompt, expectedType, retryCount = 0) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    if (!apiKey || apiKey.length < 30) {
      throw new Error("API Key inválida");
    }

    // 🔥 GOOGLE SEARCH ATIVO (sem responseMimeType)
    const payload = {
      contents: [{ 
         role: "user", 
         parts: [{ 
           text: `${systemPrompt}\n\n${userPrompt}\n\nREMINDER: Return ONLY JSON starting with { and ending with }. No markdown. No explanations.` 
         }] 
       }],
      tools: [{ google_search: {} }], // ✅ SEARCH ATIVO
      generationConfig: { 
        maxOutputTokens: 8192, 
        temperature: 0.1
        // ❌ NO responseMimeType (incompatível com tools)
      }
    };

    console.log("📤 Gemini Request (Google Search Active):", {
      type: expectedType,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log("📥 Response Status:", response.status);

      // Retry on rate limit
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`⚠️ Rate Limit - Retry ${retryCount + 1}/3 in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        return GeminiService.call(apiKey, systemPrompt, userPrompt, expectedType, retryCount + 1);
      }

      if (!response.ok) {
        const err = await response.text();
        console.error("❌ API Error:", err.substring(0, 300));
        throw new Error(`Gemini API Error ${response.status}`);
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.error("❌ Empty response");
        throw new Error("Gemini retornou vazio");
      }

      console.log("📄 Raw text length:", text.length);
      console.log("📄 Preview:", text.substring(0, 150).replace(/\n/g, ' '));

      // 🔥 MULTI-STEP PARSING
      let parsed = null;

      // Attempt 1: Direct parse
      try {
        parsed = JSON.parse(text);
        console.log("✅ Direct parse SUCCESS");
      } catch (e) {
        console.warn("⚠️ Direct parse failed, trying cleanup...");
        
        // Attempt 2: CleanJSON
        parsed = GeminiService.cleanJSON(text);
        
        if (parsed) {
          console.log("✅ CleanJSON SUCCESS");
        } else {
          // Attempt 3: Regex extraction
          console.warn("⚠️ Trying regex extraction...");
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
              console.log("✅ Regex extraction SUCCESS");
            } catch (e3) {
              console.error("❌ All parsing methods failed");
              console.error("Full text:", text);
              throw new Error("Não foi possível extrair JSON válido. Gemini pode estar retornando texto livre.");
            }
          }
        }
      }

      // Validate schema
      if (!GeminiService.validateSchema(parsed, expectedType)) {
        console.error("❌ Schema validation failed");
        console.error("Parsed data:", JSON.stringify(parsed, null, 2).substring(0, 500));
        throw new Error(`JSON válido mas estrutura incorreta para tipo '${expectedType}'`);
      }

      console.log("✅ Parse + Validation SUCCESS");
      return parsed;

    } catch (error) {
      console.error("💥 Fatal Error:", error);
      throw error;
    }
  }
};

const Validation = {
  isPipelineReady: (formData) => {
    return CONFIG.CRITICAL_FIELDS.every(field => formData[field] && formData[field].toString().trim() !== '');
  },
  validateStep: (step, formData) => {
    const errors = {};
    const check = (f) => !formData[f] && (errors[f] = true);
    
    if (step === 1) { check('productName'); check('description'); }
    if (step === 2) { check('persona'); }
    if (step === 3) { check('pricing'); }
    if (step === 4) { check('comp1'); }
    if (step === 5) { check('urgency'); }
    return errors;
  }
};

/**
 * ==============================================================================
 * MÓDULO 4: SUB-COMPONENTS
 * ==============================================================================
 */
const PipelineLogs = ({ logs, status }) => {
  const scrollRef = useRef(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-64 shadow-inner">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
          <Terminal size={12} /> ENTERPRISE_CONSOLE
        </span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/20" />
          <div className="w-2 h-2 rounded-full bg-amber-500/20" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-2">
        {logs.length === 0 && status !== 'processing' && (
          <span className="text-slate-600 italic">// Waiting for pipeline initialization...</span>
        )}
        {logs.length === 0 && status === 'processing' && (
          <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
            <Loader2 size={12} className="animate-spin"/> Connecting to Gemini API...
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2">
             <span className="text-slate-500 shrink-0">[{log.time}]</span>
             <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-indigo-300'}`}>
               {log.type === 'cmd' ? '> ' : ''}{log.message}
             </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ==============================================================================
 * MÓDULO 5: MAIN APP COMPONENT
 * ==============================================================================
 */
const GTMCopilot = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(CONFIG.STORAGE_KEYS.API_GEMINI) || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    productName: '', description: '', stage: 'Novo Produto', objective: 'Aquisição (Novos Clientes)',
    businessType: 'B2B', accountSize: '', persona: '', numCustomers: '',
    pricing: '', pricingModel: 'Por Usuário (Seat-based)', churnRate: '15', churnType: 'Logo Churn',
    nrrTarget: '110', gtmMotion: '',
    comp1: '', comp2: '', comp3: '', whereLose: '',
    urgency: '', timeline: '', ticketVal: '', ticketPeriod: 'Mensal (MRR)', riskCustomers: '', tamRisk: 0
  });

  const [status, setStatus] = useState('idle');
  const [pipelineStep, setPipelineStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [logs, setLogs] = useState([]);
  
  const [intelData, setIntelData] = useState(null);
  const [strategyData, setStrategyData] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);

  const strategyRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    setLogs(prev => [...prev, { time, message, type }]);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') setIsDarkMode(true);
    
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);

    const savedForm = localStorage.getItem(CONFIG.STORAGE_KEYS.FORM);
    if (savedForm) try { setFormData(JSON.parse(savedForm)); } catch(e){}

    return () => { 
      if (document.body.contains(script)) document.body.removeChild(script); 
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(CONFIG.STORAGE_KEYS.FORM, JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (['ticketVal', 'riskCustomers', 'ticketPeriod'].includes(field)) {
        const tVal = field === 'ticketVal' ? value : next.ticketVal;
        const rCust = field === 'riskCustomers' ? value : next.riskCustomers;
        const tPeriod = field === 'ticketPeriod' ? value : next.ticketPeriod;
        const multiplier = tPeriod?.includes('Mensal') ? 12 : 1;
        next.tamRisk = (Number(tVal) || 0) * (Number(rCust) || 0) * multiplier;
      }
      return next;
    });
  };

  const handleNext = () => {
    const stepErrors = Validation.validateStep(currentStep, formData);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) {
      setDirection(1);
      setCurrentStep(p => Math.min(p + 1, 5));
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentStep(p => Math.max(p - 1, 1));
  };

  const loadPreset = () => {
    setFormData(prev => ({
      ...prev,
      productName: "Churn Buster AI",
      description: "Plataforma enterprise que prevê churn 90 dias antes usando ML.",
      stage: "Scale-up",
      objective: "Retenção",
      businessType: "B2B",
      persona: "CRO / VP of Success",
      pricing: "15000",
      pricingModel: "Flat Fee",
      churnRate: "12",
      churnType: "Revenue Churn",
      comp1: "Gainsight",
      urgency: "Kill Revenue",
      ticketVal: "15000",
      riskCustomers: "10",
      tamRisk: 1800000
    }));
    setShowPresets(false);
    addLog("Preset 'Churn Buster AI' loaded.", 'cmd');
  };

  const downloadPDF = () => {
    if (!strategyRef.current || !window.html2pdf) { alert("PDF Lib not loaded yet."); return; }
    const opt = {
      margin: 10,
      filename: `${formData.productName.replace(/\s+/g, '_')}_Strategy.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(strategyRef.current).save();
    addLog("PDF export triggered.", 'success');
  };

  const copyToClipboard = (text, itemName) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemName);
    addLog(`${itemName} copiado!`, 'success');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const testApiKey = async () => {
    if (!apiKey) { alert("Cole sua API Key primeiro!"); return; }
    
    setTestingKey(true);
    addLog("Testing API Key...", 'cmd');
    
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const testRes = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say 'API OK'" }] }]
        })
      });
      
      if (testRes.ok) {
        alert("✅ API Key válida!");
        addLog("API Key validated successfully.", 'success');
      } else {
        const err = await testRes.text();
        alert(`❌ Erro: ${err.substring(0, 200)}`);
        addLog(`API Key test failed: ${err.substring(0, 100)}`, 'error');
      }
    } catch (e) {
      alert(`❌ Network Error: ${e.message}`);
      addLog(`Network error during test: ${e.message}`, 'error');
    } finally {
      setTestingKey(false);
    }
  };

  const runPipeline = async () => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    if (!Validation.isPipelineReady(formData)) { 
      setErrorMsg("Preencha todos os campos obrigatórios (*)"); 
      return; 
    }

    setStatus('processing');
    setPipelineStep(0);
    setErrorMsg('');
    setStatusMessage('🚀 Inicializando...');
    setLogs([]);

    try {
      addLog("Initializing Enterprise Pipeline...", 'cmd');
      
      setPipelineStep(1);
      setStatusMessage('🕵️ Intel (Google Search)...');
      addLog("Step 1: Executing Market Intel Search...");
      
      // CALL 1: INTEL
      const intelRes = await GeminiService.call(
        apiKey, 
        PROMPTS.INTEL(formData), 
        "Execute Market Intel Search using Google.", 
        'intel' // ← tipo esperado
      );

      if (!intelRes) throw new Error("Intel Generation Failed");
      
      setIntelData(intelRes);
      addLog(`Intel Received: ${intelRes.market_intel.claims.length} verified claims.`, 'success');

      setPipelineStep(2);
      setStatusMessage('🧠 Decision Engine...');
      addLog("Step 2: Running Decision Engine & Gating...");
      
      // CALL 2: STRATEGY
      const strategyRes = await GeminiService.call(
        apiKey, 
        PROMPTS.STRATEGY(formData, intelRes), 
        "Execute Strategy Generation.", 
        'strategy' // ← tipo esperado
      );

      if (!strategyRes) throw new Error("Strategy Generation Failed");
      
      setStrategyData(strategyRes);
      const ratio = strategyRes.decision_layer.unknowns_ratio;
      addLog(`Gating Check: Unknowns Ratio = ${(ratio * 100).toFixed(1)}%`, ratio > 0.3 ? 'error' : 'success');
      
      if (!strategyRes.decision_layer.strategy_allowed) {
        addLog("STRATEGY BLOCKED: Risk threshold exceeded.", 'error');
      } else {
        addLog("STRATEGY APPROVED: Generating tactical assets...", 'success');
      }

      setPipelineStep(3);
      setStatus('success');
      setStatusMessage('✅ Pronto!');
      setActiveTab('strategy');
      addLog("Pipeline Completed Successfully.", 'success');

    } catch (e) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message);
      addLog(`CRITICAL ERROR: ${e.message}`, 'error');
    }
  };

  const inputClass = (err) => `w-full p-4 rounded-xl border bg-transparent outline-none transition-all ${
    err ? 'border-red-500 ring-2 ring-red-500/20' : isDarkMode ? 'border-slate-600 focus:border-indigo-500' : 'border-slate-200 focus:border-indigo-500'
  }`;

  const variants = {
    wizard: {
      enter: (d) => ({ x: d > 0 ? 50 : -50, opacity: 0, scale: 0.95 }),
      center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
      exit: (d) => ({ zIndex: 0, x: d < 0 ? 50 : -50, opacity: 0, scale: 0.95 })
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      {/* HEADER */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">GTM Copilot <span className="text-indigo-500 text-xs align-top">ENTERPRISE</span></h1>
              <span className="text-[10px] opacity-60 font-mono">{formData.productName || 'New Project'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
               <Globe size={12} /> Google Search Active
             </div>
             <button onClick={() => setShowApiKeyModal(true)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"><Shield size={18}/></button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
               {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
             </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* TABS */}
        <div className="flex justify-center mb-8">
           <div className={`p-1.5 rounded-2xl border shadow-sm inline-flex items-center gap-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
             {[
               {id: 'input', label: '1. Setup', icon: Layout},
               {id: 'strategy', label: '2. Strategy', icon: Target, disabled: !strategyData},
               {id: 'assets', label: '3. Assets', icon: Swords, disabled: !strategyData?.strategy_layer}
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => !tab.disabled && setActiveTab(tab.id)}
                 disabled={tab.disabled}
                 className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                   activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'opacity-60 hover:opacity-100'
                 } ${tab.disabled ? 'cursor-not-allowed opacity-30' : ''}`}
               >
                 <tab.icon size={16}/> {tab.label}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT AREA */}
          <div className={activeTab === 'input' ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <AnimatePresence mode="wait">
              
              {/* TAB 1: WIZARD */}
              {activeTab === 'input' && (
                <motion.div key="wizard" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className={`rounded-3xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="h-1 bg-slate-100 dark:bg-slate-700">
                    <motion.div 
                      className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      initial={{width: 0}}
                      animate={{width: `${(currentStep / 5) * 100}%`}}
                    />
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        {React.createElement(CONFIG.WIZARD_STEPS[currentStep-1].icon, { className: "text-indigo-500" })}
                        {CONFIG.WIZARD_STEPS[currentStep-1].title}
                      </h2>
                      <span className="text-xs font-bold uppercase opacity-40">Step {currentStep} / 5</span>
                    </div>

                    <div className="min-h-[400px] relative">
                      <AnimatePresence custom={direction} mode="wait">
                        <motion.div 
                          key={currentStep}
                          custom={direction}
                          variants={variants.wizard}
                          initial="enter" animate="center" exit="exit"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className={`absolute inset-0 space-y-6 ${Object.keys(errors).length > 0 ? 'animate-shake' : ''}`}
                        >
                          {currentStep === 1 && (
                            <>
                              <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Produto *</label><input value={formData.productName} onChange={e=>handleInputChange('productName', e.target.value)} className={inputClass(errors.productName)} placeholder="Ex: AI Analytics Pro"/></div>
                              <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Descrição & Visão *</label><textarea value={formData.description} onChange={e=>handleInputChange('description', e.target.value)} className={`${inputClass(errors.description)} h-32 resize-none`} placeholder="O que faz e qual o diferencial?"/></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Estágio</label><select value={formData.stage} onChange={e=>handleInputChange('stage', e.target.value)} className={inputClass()}>{["Novo Produto", "Nova Feature", "Scale-up", "Pivot"].map(o=><option key={o}>{o}</option>)}</select></div>
                                <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Objetivo</label><select value={formData.objective} onChange={e=>handleInputChange('objective', e.target.value)} className={inputClass()}>{["Aquisição", "Retenção", "Monetização", "Eficiência"].map(o=><option key={o}>{o}</option>)}</select></div>
                              </div>
                            </>
                          )}
                          {currentStep === 2 && (
                            <>
                              <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Persona Principal *</label><input value={formData.persona} onChange={e=>handleInputChange('persona', e.target.value)} className={inputClass(errors.persona)} placeholder="Ex: VP de Vendas"/></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Tipo de Negócio</label><select value={formData.businessType} onChange={e=>handleInputChange('businessType', e.target.value)} className={inputClass()}>{["B2B", "B2C", "B2B2C", "Enterprise"].map(o=><option key={o}>{o}</option>)}</select></div>
                                <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Tamanho da Conta</label><select value={formData.accountSize} onChange={e=>handleInputChange('accountSize', e.target.value)} className={inputClass()}><option value="">Select...</option>{["SMB", "Mid-market", "Enterprise"].map(o=><option key={o}>{o}</option>)}</select></div>
                              </div>
                            </>
                          )}
                          {currentStep === 3 && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Precificação *</label>
                                  <div className="flex gap-2"><input value={formData.pricing} onChange={e=>handleInputChange('pricing', e.target.value)} className={inputClass(errors.pricing)} placeholder="Valor (R$)" /><select value={formData.pricingModel} onChange={e=>handleInputChange('pricingModel', e.target.value)} className={`${inputClass()} w-1/3`}>{["Seat-based", "Flat Fee", "Usage", "Tiered"].map(o=><option key={o}>{o}</option>)}</select></div>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex justify-between mb-2"><label className="text-xs font-bold uppercase opacity-60 block">Churn Rate (%)</label><div className="flex bg-slate-100 dark:bg-slate-700 rounded p-1 gap-1">{["Logo Churn", "Revenue Churn"].map(t => (<button key={t} onClick={()=>handleInputChange('churnType', t)} className={`px-2 py-0.5 text-[10px] rounded ${formData.churnType===t ? 'bg-white dark:bg-slate-600 shadow' : 'opacity-50'}`}>{t}</button>))}</div></div>
                                  <input type="range" min="0" max="50" value={formData.churnRate} onChange={e=>handleInputChange('churnRate', e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                  <div className="text-right font-bold text-indigo-500">{formData.churnRate}%</div>
                                </div>
                              </div>
                            </>
                          )}
                          {currentStep === 4 && (
                            <>
                              <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Principais Concorrentes *</label><div className="grid grid-cols-2 gap-4"><input value={formData.comp1} onChange={e=>handleInputChange('comp1', e.target.value)} className={inputClass(errors.comp1)} placeholder="Competidor 1"/><input value={formData.comp2} onChange={e=>handleInputChange('comp2', e.target.value)} className={inputClass()} placeholder="Competidor 2 (Opcional)"/></div></div>
                              <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Onde perdemos deals?</label><textarea value={formData.whereLose} onChange={e=>handleInputChange('whereLose', e.target.value)} className={`${inputClass()} h-24 resize-none`} placeholder="Motivo principal de perda..."/></div>
                            </>
                          )}
                          {currentStep === 5 && (
                            <>
                              <div><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Urgência do Problema *</label><select value={formData.urgency} onChange={e=>handleInputChange('urgency', e.target.value)} className={inputClass(errors.urgency)}><option value="">Select...</option>{["Kill Revenue (Crítico)", "Important (Necessário)", "Nice to Have (Opcional)"].map(o=><option key={o} value={o}>{o}</option>)}</select></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="text-xs font-bold uppercase opacity-60 mb-2 block">Risco Financeiro (TAM Risk)</label><div className="flex gap-2 items-center"><input type="number" value={formData.ticketVal} onChange={e=>handleInputChange('ticketVal', e.target.value)} className={inputClass()} placeholder="Ticket Médio"/><span className="opacity-50">x</span><input type="number" value={formData.riskCustomers} onChange={e=>handleInputChange('riskCustomers', e.target.value)} className={inputClass()} placeholder="Qtd Clientes"/></div></div>
                                <div className="col-span-2 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center"><span className="text-xs font-bold uppercase opacity-50">Total em Risco</span><span className="text-xl font-mono font-bold text-red-500">R$ {formData.tamRisk.toLocaleString('pt-BR')}</span></div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                       <button onClick={handlePrev} disabled={currentStep===1} className="px-4 py-2 rounded-lg font-bold opacity-50 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><ChevronLeft size={16}/> Voltar</button>
                       {currentStep < 5 ? (
                         <button onClick={handleNext} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2">Próximo <ChevronRight size={16}/></button>
                       ) : (
                         <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 font-bold text-sm">
                           <CheckCircle size={16}/> Ready to Launch
                         </div>
                       )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: STRATEGY */}
              {activeTab === 'strategy' && strategyData && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-6" ref={strategyRef}>
                  
                  <div className={`p-4 rounded-xl border shadow-sm flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex gap-2">
                       <button onClick={()=>setActiveTab('input')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:opacity-80">Edit Input</button>
                       <span className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-2"></span>
                       <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${strategyData.decision_layer.unknowns_ratio > 0.3 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                         <AlertTriangle size={12}/> Risk: {Math.round(strategyData.decision_layer.unknowns_ratio * 100)}%
                       </div>
                    </div>
                    <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"><Download size={14}/> PDF</button>
                  </div>

                  {!strategyData.decision_layer.strategy_allowed && (
                    <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
                      <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-500 animate-pulse"><ShieldAlert size={32}/></div>
                      <h3 className="text-2xl font-bold text-amber-500">Estratégia Bloqueada</h3>
                      <p className="opacity-80 max-w-lg mx-auto">Incerteza de {Math.round(strategyData.decision_layer.unknowns_ratio * 100)}%. Campos críticos faltando: {strategyData.decision_layer.unknowns.map(u=>u.field).join(', ')}</p>
                    </div>
                  )}

                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Scale className="text-indigo-500"/> Decisões Críticas</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {strategyData.decision_layer.critical_decisions.map((d, i) => (
                        <div key={i} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700">
                           <div className="flex justify-between mb-2">
                             <h4 className="font-bold text-sm">{d.title}</h4>
                             <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{Math.round(d.preferred_option.confidence * 100)}%</span>
                           </div>
                           <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">{d.preferred_option.option}</p>
                           <p className="text-xs opacity-70">{d.preferred_option.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {strategyData.decision_layer.strategy_allowed && strategyData.strategy_layer && (
                    <div className="space-y-6">
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-8 shadow-xl">
                         <div className="relative z-10">
                           <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase border border-white/20 mb-4 inline-block">GTM Thesis</span>
                           <h2 className="text-3xl font-extrabold mb-4">"{strategyData.strategy_layer.gtm_thesis.enemy}"</h2>
                           <p className="text-lg text-slate-300">{strategyData.strategy_layer.gtm_thesis.tension}</p>
                         </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        {['days_0_30', 'days_31_60', 'days_61_90'].map((period, i) => (
                          <div key={period} className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <h4 className={`font-bold mb-3 uppercase text-xs ${i===0?'text-emerald-500':i===1?'text-blue-500':'text-purple-500'}`}>
                              {period.replace('days_', '').replace('_', '-')} Dias
                            </h4>
                            <ul className="space-y-2">
                              {strategyData.strategy_layer.plan_30_60_90[period].map((action, idx) => (
                                <li key={idx} className="text-sm flex gap-2 items-start opacity-80">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-current opacity-50 shrink-0"/> {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {intelData && (
                    <div className={`p-4 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <strong className="block mb-2 uppercase opacity-50">Fontes (Google Search)</strong>
                      <div className="flex flex-wrap gap-2">
                        {intelData.market_intel.claims.filter(c=>c.source_url).map((c, i) => (
                           <a key={i} href={c.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-indigo-500/10 text-indigo-500 transition-colors">
                             <ExternalLink size={10}/> {c.source_name}
                           </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: ASSETS */}
              {activeTab === 'assets' && strategyData?.strategy_layer && (
                 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-8">
                    
                    <div className={`p-8 rounded-3xl border text-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                       <h3 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                         {strategyData.strategy_layer.messaging.core_message}
                       </h3>
                       <p className="opacity-60 text-lg">{strategyData.strategy_layer.messaging.sub_headline}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                       <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold flex items-center gap-2 text-red-500"><Swords size={18}/> Battlecard</h4>
                            <button 
                              onClick={() => copyToClipboard(
                                `BATTLECARD: ${strategyData.strategy_layer.battlecards.main_competitor.competitor}\n\nForça Deles: ${strategyData.strategy_layer.battlecards.main_competitor.their_strength}\n\nNossa Vantagem: ${strategyData.strategy_layer.battlecards.main_competitor.our_kill_point}`,
                                'Battlecard'
                              )}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              {copiedItem === 'Battlecard' ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                            </button>
                          </div>
                          <div className="space-y-4 text-sm">
                             <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                               <strong className="block text-xs uppercase opacity-50 mb-1">Ponto Forte Deles</strong>
                               {strategyData.strategy_layer.battlecards.main_competitor.their_strength}
                             </div>
                             <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                               <strong className="block text-xs uppercase opacity-50 mb-1">Nossa Vantagem</strong>
                               {strategyData.strategy_layer.battlecards.main_competitor.our_kill_point}
                             </div>
                          </div>
                       </div>

                       <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold flex items-center gap-2 text-indigo-500"><Target size={18}/> Objeções</h4>
                            <button 
                              onClick={() => copyToClipboard(
                                strategyData.strategy_layer.battlecards.objection_handling.map(o => `Q: ${o.objection}\nA: ${o.answer}`).join('\n\n'),
                                'Objections'
                              )}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              {copiedItem === 'Objections' ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                            </button>
                          </div>
                          <ul className="space-y-3">
                            {strategyData.strategy_layer.battlecards.objection_handling.map((obj, i) => (
                              <li key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700">
                                <strong className="block text-xs text-amber-500 mb-1">"{obj.objection}"</strong>
                                <p className="text-xs opacity-80">{obj.answer}</p>
                              </li>
                            ))}
                          </ul>
                       </div>
                    </div>
                 </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT SIDEBAR (only on input) */}
          {activeTab === 'input' && (
            <div className="lg:col-span-4 space-y-6">
              
              <PipelineLogs logs={logs} status={status} />

              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><Activity size={16}/> Pipeline Control</h3>
                
                {status === 'idle' && (
                  <div className="space-y-3">
                    <button 
                      onClick={runPipeline}
                      disabled={!Validation.isPipelineReady(formData)}
                      className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Zap size={16}/> Gerar Estratégia
                    </button>
                    <button 
                      onClick={loadPreset}
                      className="w-full py-2 rounded-lg text-xs font-medium border hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Load Preset (Demo)
                    </button>
                  </div>
                )}

                {status === 'processing' && (
                  <div className="text-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2"/>
                    <p className="text-sm font-mono">{statusMessage}</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="text-center py-4 text-emerald-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2"/>
                    <p className="text-sm font-bold">Pipeline Completo!</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="text-center py-4 text-red-500">
                    <XCircle className="w-8 h-8 mx-auto mb-2"/>
                    <p className="text-xs">{errorMsg}</p>
                    <button onClick={() => setStatus('idle')} className="mt-2 text-xs underline">Tentar Novamente</button>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <strong className="block mb-2 uppercase opacity-50">Completude</strong>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${(CONFIG.CRITICAL_FIELDS.filter(f => formData[f]).length / CONFIG.CRITICAL_FIELDS.length) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] opacity-60">
                  {CONFIG.CRITICAL_FIELDS.filter(f => formData[f]).length} / {CONFIG.CRITICAL_FIELDS.length} campos obrigatórios
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API KEY MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowApiKeyModal(false)}>
          <div onClick={e => e.stopPropagation()} className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Shield className="text-indigo-500" size={20}/> API Key</h3>
              <button onClick={() => setShowApiKeyModal(false)}><XCircle size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Google Gemini API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  placeholder="AIza..."
                />
                <p className="text-xs opacity-60 mt-1">
                  Obtenha em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 underline">aistudio.google.com</a>
                </p>
              </div>

              <button
                onClick={testApiKey}
                disabled={testingKey}
                className="w-full py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-mono hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                {testingKey ? <Loader2 className="w-4 h-4 animate-spin inline"/> : '🧪'} Testar Chave
              </button>

              <button
                onClick={() => {
                  localStorage.setItem(CONFIG.STORAGE_KEYS.API_GEMINI, apiKey);
                  setShowApiKeyModal(false);
                }}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GTMCopilot;

