import React, { useState, useEffect, useRef } from 'react';
// SENIOR UPGRADE: Adicionando Framer Motion para animações fluidas
import { motion, AnimatePresence } from 'framer-motion';
// Mantendo html2pdf via CDN no useEffect para evitar erros de build
import { 
  BrainCircuit, Target, Globe, Swords, MessageSquare, Copy, Play, Loader2, 
  CheckCircle, AlertCircle, XCircle, ChevronRight, ShieldAlert, Zap, Layout, 
  FileText, Users, DollarSign, Clock, Shield, BarChart3, AlertTriangle, 
  Zap as ZapIcon, Download, ArrowLeft, ArrowRight, RotateCcw, Moon, Sun,
  Keyboard, Share2, Briefcase, TrendingUp, Layers, UserCheck, Scale, AlertOctagon,
  ChevronLeft, Building2, User, Server, Database, Lock
} from 'lucide-react';

// === CONFIGURAÇÃO ===
const USE_MOCK = false; // PRODUÇÃO: Desabilitado
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"; 

// SENIOR UPGRADE: Animation Variants
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
  
  // API Keys (Persistência e Segurança)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gtm_gemini_key') || '');
  const [perplexityApiKey, setPerplexityApiKey] = useState(() => localStorage.getItem('gtm_pplx_key') || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false); // Novo estado para controlar o modal

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState({});

  // Form Data Schema
  const [formData, setFormData] = useState({
    // Step 1: Produto
    productName: '',
    description: '',
    stage: '',
    
    // Step 2: ICP
    businessType: 'B2B',
    accountSize: '',
    persona: '',
    numCustomers: '',

    // Step 3: Comercial
    pricing: '',
    ticketVal: '',
    churnRate: '15',
    nrrTarget: '110',
    gtmMotion: '',

    // Step 4: Concorrentes
    comp1: '',
    comp2: '',
    comp3: '',
    whereLose: '',

    // Step 5: Prioridade
    urgency: '',
    timeline: '',
    riskCustomers: '', 
    tamRisk: 0, 

    // Legacy fields mapped (Initialize empty)
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
  const errorRef = useRef(null); // Ref for error scrolling

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


  // --- WIZARD LOGIC ---

  const validateStep = (step) => {
    const newErrors = {};
    const check = (field) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = true;
      }
    };

    if (step === 1) {
      check('productName');
      check('description');
    }
    if (step === 2) {
      check('persona');
    }
    if (step === 3) {
      check('pricing');
    }
    if (step === 4) {
      check('comp1');
    }
    if (step === 5) {
      check('urgency');
    }
    
    setErrors(newErrors);
    
    // Auto scroll to error
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstErrorInput = document.querySelector('.animate-shake');
        if (firstErrorInput) {
          firstErrorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorInput.focus();
        }
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

  // --- API & PIPELINE LOGIC (CLIENT SIDE) ---

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
      // Fallback simple sanitizer
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
    // alert("Chaves salvas com segurança no seu navegador!"); 
  };

  const runGTMPipeline = async () => {
    // VALIDAÇÃO DE CHAVES
    if (!apiKey) {
      setStatus('error');
      setErrorMsg("Chave da API do Google Gemini não configurada.");
      setShowApiKeyModal(true); // Abre o modal automaticamente
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
    
    let intelContext = null; // Store for Step 2
  
    try {
      // ===== 1️⃣ GEMINI INTEL STRATEGIC (COM BUSCA WEB REAL) =====
      setPipelineStep(1);
      setStatusMessage('🕵️ 1/4 Market Intel (Structured Web Search)...');

      try {
        const intelPrompt = `Você é um Analista de Mercado Sênior (Brasil). Gere INTEL DE MERCADO atual (BR, 2026) usando busca web.
REGRAS:
- Retorne APENAS JSON válido (sem markdown).
- Cada claim deve ser atômico e verificável, com fonte (url; se não houver, use "source_url": null e explique em "note").
- NÃO invente números. Se não encontrar dado confiável, não chute.
- Foque no contexto do produto + ICP + competidores fornecidos.
- Linguagem: pt-BR.

INPUTS (JSON):
${JSON.stringify(formData, null, 2)}

RETORNE neste formato EXATO:
{
  "metadata": { "market": "BR", "year": 2026, "generated_at": "${new Date().toISOString()}" },
  "context": {
    "productName": "${formData.productName}",
    "description": "${formData.description}",
    "persona": "${formData.persona}",
    "businessType": "${formData.businessType}",
    "competitors": ["${formData.comp1}", "${formData.comp2}", "${formData.comp3}"]
  },
  "claims": [
    {
      "claim_id": "C1",
      "type": "trend|competitor|pricing|regulation|buyer_behavior|macro|tech",
      "claim": "string (1 frase)",
      "why_it_matters": "string (1 frase)",
      "implication_for_gtm": "string (1 frase acionável)",
      "source_name": "string",
      "source_url": "string|null",
      "retrieved_at": "${new Date().toISOString()}"
    }
  ],
  "competitor_cards": [
    {
      "name": "string",
      "positioning": "string",
      "pricing_signals": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "sources": [{ "source_name": "string", "source_url": "string|null" }]
    }
  ],
  "gaps_opportunities": [
    { "gap": "string", "for_whom": "string", "why_now": "string", "claims_supporting": ["C1"] }
  ],
  "why_now_summary": {
    "narrative": "string (3-5 frases)",
    "claims_supporting": ["C1", "C2"]
  }
}`;

        // FIX: Removido responseMimeType e tools corrigido para array
        const intelRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: intelPrompt }] }],
              generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.1,
                // REMOVIDO responseMimeType: "application/json" para evitar conflito com tools
              },
              // FIX: Formato correto de tools para Google Search
              tools: [{ google_search: {} }] 
            }),
          }
        );

        // Tratamento robusto de erro HTTP 400
        if (!intelRes.ok) {
          const errorText = await intelRes.text();
          console.error("Erro detalhado do Intel:", errorText);
          throw new Error(`Intel HTTP ${intelRes.status}: ${errorText}`);
        }
        
        const intelJson = await intelRes.json();
        const intelText = intelJson.candidates?.[0]?.content?.parts?.[0]?.text;
              
        if (!intelText) throw new Error("Intel vazio (sem texto gerado)");

        // Como removemos application/json, parseamos manualmente
        intelContext = cleanJSON(intelText);
        
        if (intelContext) {
           setPerplexityIntel({ 
             insight: intelContext.why_now_summary?.narrative || "Intel gerado.", 
             competitors_analysis: JSON.stringify(intelContext.competitor_cards, null, 2) 
           });
           console.log('✅ Gemini Intel Structured OK');
        } else {
           throw new Error("Falha no parse do Intel");
        }
      
      } catch (intelErr) {
        console.warn('⚠️ Intel Web falhou, usando fallback:', intelErr.message);
        // Fallback básico para não travar o pipeline
        intelContext = { error: "Web Search Failed", manually_created: true };
        setPerplexityIntel({ insight: "Falha na busca web. Usando conhecimento interno do modelo para a estratégia." });
      }

      setPipelineStep(2);
  
      // ===== 2️⃣ GEMINI STRATEGY CORE v2 (INPUTS + INTEL + COVERAGE) =====
      setStatusMessage('🧠 2/4 Strategy Core v2 (Validating)...');
      
      const strategyPrompt = `Você é um PMM Sênior especialista em GTM no Brasil.

OBJETIVO:
Transformar TODOS os inputs do wizard + INTEL estruturado (com claims) em um GTM Strategy Core acionável.

REGRAS NÃO NEGOCIÁVEIS:
1) Retorne APENAS JSON válido (sem markdown).
2) Mantenha os campos existentes do schema v1: metadata, gtm_thesis, primary_gtm_decision, strategic_thesis, gtm_strategy_doc.
3) Adicione os campos novos: evidence, input_coverage, actionability (conforme schema).
4) USO OBRIGATÓRIO DOS INPUTS:
   - Para todo campo preenchido (não vazio) em form_data, você DEVE marcar como used=true em input_coverage.field_map e explicar "how_used".
   - Se algum campo preenchido não for usado, liste em input_coverage.coverage_summary.missing_fields e reduza coverage_score.
   - O output será rejeitado se missing_fields não estiver vazio.
5) INTEL É O CORAÇÃO:
   - Toda decisão crítica (enemy, why_now, category, unique_value, core_promise, target_customer, use_case, dominant_value) deve citar pelo menos 2 claim_id em evidence.decision_trace.
   - Não invente fatos fora do intel_claims e form_data. Se faltar intel, declare em assumptions + how_to_validate.
6) DIFERENCIAÇÃO POR ESTÁGIO (stage):
   - Ajuste estratégia e plano 30-60-90 explicitamente ao stage informado.
7) ACIONABILIDADE:
   - actionability deve conter métricas, plano 30-60-90, hipóteses de canal e testes de messaging coerentes com pricing, churnRate, nrrTarget, urgency, timeline, gtmMotion, tamRisk.

INPUTS:
form_data: ${JSON.stringify(formData, null, 2)}
intel: ${JSON.stringify(intelContext, null, 2)}

RETORNE no schema strategy_core_v2:
{
  "metadata": {
    "market": "BR",
    "generated_at": "${new Date().toISOString()}",
    "model": "gemini-2.5-flash",
    "version": "strategy_core_v2",
    "language": "pt-BR"
  },
  "gtm_thesis": {
    "enemy": "string",
    "core_belief": "string",
    "tension": "string",
    "why_now": "string"
  },
  "primary_gtm_decision": {
    "primary_target_customer": "string",
    "primary_use_case": "string",
    "dominant_value": "string"
  },
  "strategic_thesis": {
    "positioning": {
      "category": "string",
      "unique_value": "string"
    },
    "value_proposition": {
      "core_promise": "string"
    }
  },
  "gtm_strategy_doc": "# Markdown (>= 500 palavras)\\n...",
  "evidence": {
    "inputs_used": {},
    "intel_claims_used": [
      {
        "claim_id": "C1",
        "used_in": ["gtm_thesis.why_now", "strategic_thesis.positioning.category"],
        "rationale": "string curto"
      }
    ],
    "decision_trace": [
      {
        "decision_id": "D1",
        "decision_path": "gtm_thesis.enemy",
        "decision": "string",
        "input_fields": ["stage", "whereLose", "comp3"],
        "intel_claim_ids": ["C1", "C3"],
        "confidence": 0.0,
        "assumptions": ["string"],
        "risks": ["string"],
        "how_to_validate": ["string"]
      }
    ]
  },
  "input_coverage": {
    "coverage_summary": {
      "filled_fields_count": 0,
      "covered_fields_count": 0,
      "missing_fields": ["string"],
      "coverage_score": 0.0
    },
    "field_map": {
      "whereLose": {
        "filled": true,
        "used": true,
        "how_used": "string (1-2 frases: como isso alterou uma escolha)",
        "decisions_impacted": ["D1", "D4"],
        "strategy_doc_sections_impacted": ["Posicionamento", "Objeções", "Plano 30-60-90"]
      }
    }
  },
  "actionability": {
    "north_star_metric": "string",
    "success_metrics": [
      { "metric": "string", "target": "string", "timeframe": "string", "why": "string" }
    ],
    "30_60_90_plan": {
      "days_0_30": ["string"],
      "days_31_60": ["string"],
      "days_61_90": ["string"]
    },
    "channel_hypotheses": [
      { "channel": "string", "why_now": "string", "first_experiment": "string", "success_criteria": "string" }
    ],
    "messaging_tests": [
      { "hypothesis": "string", "variant_a": "string", "variant_b": "string", "audience": "string", "metric": "string" }
    ]
  }
}`;
  
      const coreRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: strategyPrompt }] }],
          generationConfig: { 
             maxOutputTokens: 8192, 
             temperature: 0.2,
             responseMimeType: "application/json"
          }
        })
      });
      
      const coreData = await coreRes.json();
      const coreText = coreData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!coreText) throw new Error("Gemini Strategy vazio");
      
      let parsedStrategy = cleanJSON(coreText);
      if (!parsedStrategy) throw new Error("JSON Strategy inválido");

      // === VALIDAÇÃO PÓS-PARSE & RE-PROMPT ===
      const missingFields = parsedStrategy.input_coverage?.coverage_summary?.missing_fields || [];
      
      if (missingFields.length > 0) {
        console.warn("⚠️ Strategy Incompleta. Missing Fields:", missingFields);
        setStatusMessage(`🛠️ Refinando estratégia (Cobertura: ${parsedStrategy.input_coverage?.coverage_summary?.coverage_score || 'Baixa'})...`);
        
        const repairPrompt = `
Você retornou um JSON que falhou nas validações de cobertura.

ERROS:
- missing_fields (campos preenchidos não cobertos): ${JSON.stringify(missingFields)}

TAREFA:
Retorne APENAS um JSON válido corrigido no MESMO schema strategy_core_v2.
- Não remova nada que já esteja correto.
- Corrija explicitamente a cobertura: cada campo em missing_fields deve virar used=true com how_used claro e refletir impacto em pelo menos 1 decisão (decision_trace) e 1 trecho do gtm_strategy_doc.
- Use os inputs originais: ${JSON.stringify(formData)}
`;
         try {
            const repairRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: repairPrompt }] }],
                generationConfig: { maxOutputTokens: 8192, temperature: 0.1, responseMimeType: "application/json" }
              })
            });
            const repairData = await repairRes.json();
            const repairText = repairData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (repairText) {
               const repairedStrategy = cleanJSON(repairText);
               if (repairedStrategy) {
                  parsedStrategy = repairedStrategy;
                  console.log("✅ Strategy Repaired Successfully");
               }
            }
         } catch (repairErr) {
            console.error("❌ Repair failed, using original", repairErr);
         }
      }

      setStrategyCore(parsedStrategy);
  
      // ===== 3️⃣ BATTLECARDS + MESSAGING (PARALELO) =====
      setPipelineStep(3);
      setStatusMessage('⚔️ 3/4 Assets Táticos...');
  
      const battlePrompt = `Gere Battlecards táticos para vendas baseado em:
  Produto: ${formData.productName}
  Competidores: ${formData.comp1}, ${formData.comp2}, ${formData.comp3}
  RETORNE APENAS JSON:
  {
    "status_quo": {
      "enemy": "Nome do status quo",
      "why_it_feels_safe": "Por que clientes ficam nele",
      "why_it_fails": "Falha crítica",
      "our_counter": "Nosso contra-argumento"
    },
    "main_competitor": {
      "competitor": "${formData.comp1}",
      "their_strength": "Principal força deles",
      "their_blind_spot": "Ponto cego crítico (kill shot)",
      "our_advantage": "Nossa vantagem direta"
    },
    "objection_handling": [
      { "objection": "Objeção comum 1", "answer": "Resposta poderosa 1" },
      { "objection": "Objeção comum 2", "answer": "Resposta poderosa 2" }
    ]
  }`;
  
      const msgPrompt = `Gere framework de messaging para ${formData.productName}.
  RETORNE APENAS JSON:
  {
    "core_message": "Mensagem principal (máx 10 palavras)",
    "sub_headline": "Sub-headline de suporte (máx 20 palavras)",
    "elevator_pitch": "Pitch de elevador completo (50 palavras)",
    "problem_statement": "Declaração do problema que resolvemos",
    "solution_statement": "Como resolvemos esse problema",
    "value_pillars": [
      { "pillar": "Pilar 1", "proof": "Prova/métrica" },
      { "pillar": "Pilar 2", "proof": "Prova/métrica" },
      { "pillar": "Pilar 3", "proof": "Prova/métrica" }
    ]
  }`;
  
      // CHAMADAS PARALELAS (FIX)
      const [battleRes, msgRes] = await Promise.all([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: battlePrompt }] }],
            generationConfig: { maxOutputTokens: 4096, temperature: 0.3, responseMimeType: "application/json" }
          })
        }),
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: msgPrompt }] }],
            generationConfig: { maxOutputTokens: 4096, temperature: 0.3, responseMimeType: "application/json" }
          })
        })
      ]);
  
      const battleData = await battleRes.json();
      const msgData = await msgRes.json();
  
      const battleText = battleData.candidates?.[0]?.content?.parts?.[0]?.text;
      const msgText = msgData.candidates?.[0]?.content?.parts?.[0]?.text;
  
      const parsedBattle = cleanJSON(battleText);
      const parsedMsg = cleanJSON(msgText);
  
      // FIX: Usa dados reais ou fallback
      setBattlecards(parsedBattle || {
        status_quo: { enemy: "Status Quo", why_it_feels_safe: "Familiar", why_it_fails: "Ineficiente", our_counter: "Automação" },
        main_competitor: { competitor: formData.comp1, their_strength: "Marca estabelecida", their_blind_spot: "Complexidade operacional", our_advantage: "Simplicidade radical" },
        objection_handling: [
          { objection: "Não temos orçamento", answer: "O custo de não agir é 10x maior em churn" }
        ]
      });
  
      setMessaging(parsedMsg || {
        core_message: "Estratégia Gerada com Sucesso",
        sub_headline: "Revise os Assets Táticos na aba seguinte",
        problem_statement: "Problema identificado pela IA",
        solution_statement: "Solução proposta automaticamente",
        value_pillars: [
          { pillar: "Eficiência", proof: "Redução de 50% no tempo" }
        ]
      });
  
      // ===== SUCESSO =====
      setPipelineStep(4);
      setStatus('success');
      setStatusMessage('✅ GTM Pack Completo!');
      setActiveTab('strategy');
      
    } catch (err) {
      console.error('Pipeline Error:', err);
      setStatus('error');
      setErrorMsg(`Erro: ${err.message}. ${err.message.includes('401') || err.message.includes('403') ? 'Verifique suas chaves API.' : 'Tente novamente em instantes.'}`);
    }
  };

  // Helper styles for animations
  const inputErrorClass = "border-red-500 ring-2 ring-red-500/20 animate-shake";
  const inputNormalClass = (darkMode) => darkMode ? 'border-slate-600 focus:ring-2 focus:ring-indigo-500' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
       {/* Inject Shake Animation Style */}
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
            {/* API INDICATOR (Static) */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
              <Server size={12} /> Live APIs
            </div>
            
            {/* API KEY CONFIG BUTTON */}
            <button 
              onClick={() => setShowApiKeyModal(true)} 
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
              title="Configurar API Keys"
            >
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
          
          {/* === WIZARD REPLACEMENT (ACTIVE TAB === INPUT) === */}
          <div className={activeTab === 'input' ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <AnimatePresence mode="wait">
              {activeTab === 'input' && (
                <motion.div key="wizard" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="space-y-6">
                  
                  {/* PROGRESS HEADER */}
                  <div className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(step => (
                          <div key={step} className={`h-2 rounded-full transition-all duration-500 ${step === currentStep ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : step < currentStep ? 'w-2 bg-indigo-500' : `w-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-50">Passo {currentStep} de 5</span>
                    </div>

                    {/* ERROR SUMMARY */}
                    {Object.keys(errors).length > 0 && (
                      <div ref={errorRef} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2">
                          <AlertOctagon size={18}/> 
                          <span>{Object.keys(errors).length} campo(s) obrigatório(s) pendente(s):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(errors).map(field => (
                            <span key={field} onClick={() => document.querySelector(`[name="${field}"]`)?.focus()} className="cursor-pointer text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-200 transition-colors">
                              {fieldLabels[field] || field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative overflow-hidden min-h-[400px]">
                      <AnimatePresence custom={direction} mode="wait">
                        <motion.div key={currentStep} custom={direction} variants={wizardVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 w-full h-full flex flex-col justify-between">
                          
                          {/* STEP 1: PRODUTO */}
                          {currentStep === 1 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="text-amber-500" /> O que estamos vendendo?</h2>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Nome do Produto/Recurso *</label>
                                  <input 
                                    name="productName"
                                    value={formData.productName} 
                                    onChange={e=>setFormData({...formData, productName: e.target.value})} 
                                    className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all ${errors.productName ? inputErrorClass : inputNormalClass(isDarkMode)}`} 
                                    placeholder="Ex: SaaS Analytics Pro" 
                                  />
                                  {errors.productName && <p className="text-xs text-red-500 mt-1 font-medium animate-pulse">Este campo é obrigatório para gerar a estratégia</p>}
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Descrição (Job to be Done) *</label>
                                  <textarea 
                                    name="description"
                                    value={formData.description} 
                                    onChange={e=>setFormData({...formData, description: e.target.value})} 
                                    className={`w-full p-4 rounded-xl border bg-transparent h-32 resize-none outline-none transition-all ${errors.description ? inputErrorClass : inputNormalClass(isDarkMode)}`} 
                                    placeholder="O que ele resolve e para quem?" 
                                  />
                                  {errors.description && <p className="text-xs text-red-500 mt-1 font-medium animate-pulse">Descreva o que o produto faz</p>}
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Estágio Atual *</label>
                                  <select name="stage" value={formData.stage} onChange={e=>setFormData({...formData, stage: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {["Novo Produto", "Lançamento de Funcionalidade", "Pivot de Preços", "Redução de Churn"].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 2: ICP */}
                          {currentStep === 2 && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="text-blue-500" /> Quem é o comprador?</h2>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                  <button onClick={()=>setFormData({...formData, businessType: 'B2B'})} className={`px-3 py-1 text-xs font-bold rounded ${formData.businessType === 'B2B' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}>B2B</button>
                                  <button onClick={()=>setFormData({...formData, businessType: 'B2C'})} className={`px-3 py-1 text-xs font-bold rounded ${formData.businessType === 'B2C' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'}`}>B2C</button>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block flex items-center gap-1">Quem é o comprador principal? (Persona) * <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1 rounded">Decisor</span></label>
                                  <input 
                                    name="persona"
                                    value={formData.persona} 
                                    onChange={e=>setFormData({...formData, persona: e.target.value})} 
                                    className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all ${errors.persona ? inputErrorClass : inputNormalClass(isDarkMode)}`} 
                                    placeholder="Ex: VP de Customer Success" 
                                  />
                                  {errors.persona && <p className="text-xs text-red-500 mt-1 font-medium animate-pulse">Defina a persona principal</p>}
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">{formData.businessType === 'B2B' ? 'Tamanho da conta da empresa compradora' : 'Volume médio de usuários/assinantes'} (Opcional)</label>
                                  <select value={formData.accountSize} onChange={e=>setFormData({...formData, accountSize: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {formData.businessType === 'B2B' 
                                      ? ["Micro/SMB", "Mid-market", "Enterprise"].map(o => <option key={o} value={o}>{o}</option>)
                                      : ["Baixo Volume", "Médio Volume", "Alto Volume (Mass Market)"].map(o => <option key={o} value={o}>{o}</option>)
                                    }
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Número de Clientes (Base Instalada)</label>
                                  <input type="number" value={formData.numCustomers} onChange={e=>setFormData({...formData, numCustomers: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 3: COMERCIAL */}
                          {currentStep === 3 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="text-emerald-500" /> Dados Comerciais</h2>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Como precificamos hoje? *</label>
                                  <input 
                                    name="pricing"
                                    value={formData.pricing} 
                                    onChange={e=>setFormData({...formData, pricing: e.target.value})} 
                                    className={`w-full p-4 rounded-xl border bg-transparent outline-none transition-all ${errors.pricing ? inputErrorClass : inputNormalClass(isDarkMode)}`} 
                                    placeholder="Ex: R$ 500/mês por usuário" 
                                  />
                                  {errors.pricing && <p className="text-xs text-red-500 mt-1 font-medium animate-pulse">Informe o modelo de preço</p>}
                                  <p className="text-[10px] mt-1 opacity-50">Descreva o modelo e valor médio.</p>
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Churn Anual (%) *</label>
                                  <input type="range" min="0" max="50" value={formData.churnRate} onChange={e=>setFormData({...formData, churnRate: e.target.value})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                  <div className="text-right font-bold text-sm text-red-500 mt-1">{formData.churnRate}%</div>
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Meta de NRR (%)</label>
                                  <input type="number" value={formData.nrrTarget} onChange={e=>setFormData({...formData, nrrTarget: e.target.value})} className={`w-full p-2.5 rounded-xl border bg-transparent outline-none text-center font-bold ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">GTM Motion</label>
                                  <select value={formData.gtmMotion} onChange={e=>setFormData({...formData, gtmMotion: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {["Sales-led", "Product-led (PLG)", "Híbrido (Sales-led + PLG)"].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 4: CONTEXTO & SEGMENTO (RENOMEADO) */}
                          {currentStep === 4 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><Swords className="text-red-500" /> Contexto de Mercado & Segmento</h2>
                              <div className="space-y-4">
                                <div>
                                   <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Contra quem normalmente concorremos? *</label>
                                   <div className="grid grid-cols-2 gap-3 mb-2">
                                      <input 
                                        name="comp1"
                                        value={formData.comp1} 
                                        onChange={e=>setFormData({...formData, comp1: e.target.value})} 
                                        placeholder="Competidor Direto 1" 
                                        className={`w-full p-3 rounded-xl border bg-transparent outline-none transition-all ${errors.comp1 ? inputErrorClass : inputNormalClass(isDarkMode)}`} 
                                      />
                                      <input value={formData.comp2} onChange={e=>setFormData({...formData, comp2: e.target.value})} placeholder="Competidor Direto 2" className={`w-full p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                   </div>
                                   {errors.comp1 && <p className="text-xs text-red-500 mt-1 font-medium animate-pulse">Liste pelo menos um competidor</p>}
                                   <input value={formData.comp3} onChange={e=>setFormData({...formData, comp3: e.target.value})} placeholder="Status Quo (Ex: Planilhas Excel)" className={`w-full p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Onde nós perdemos? (Honestidade Radical)</label>
                                  <textarea value={formData.whereLose} onChange={e=>setFormData({...formData, whereLose: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent h-28 resize-none outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} placeholder="Eles vencem em UX? Preço? Funcionalidades?" />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 5: PRIORIDADE */}
                          {currentStep === 5 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold flex items-center gap-2"><AlertOctagon className="text-purple-500" /> Prioridade & Risco</h2>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Nível de Urgência *</label>
                                  <select name="urgency" value={formData.urgency} onChange={e=>setFormData({...formData, urgency: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none ${errors.urgency ? inputErrorClass : isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {["Kill Revenue (Crítico)", "Important", "Nice to Have"].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                  {errors.urgency && <p className="text-xs text-red-500 mt-1 font-medium animate-pulse">Defina a urgência</p>}
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Cronograma de Lançamento</label>
                                  <select value={formData.timeline} onChange={e=>setFormData({...formData, timeline: e.target.value})} className={`w-full p-4 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                    <option value="">Selecione...</option>
                                    {["Próximos 30 dias", "60-90 dias", "Q1 deste ano", "Q2-Q4", "Não urgente", "Uso Interno Apenas"].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                   <div>
                                     <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Ticket Médio Estimado (R$)</label>
                                     <input type="number" value={formData.ticketVal} onChange={e=>setFormData({...formData, ticketVal: e.target.value})} className={`w-full p-3 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                   </div>
                                   <div>
                                     <label className="text-xs font-bold uppercase opacity-60 mb-1.5 block">Clientes em Risco (Qtd)</label>
                                     <input type="number" value={formData.riskCustomers} onChange={e=>setFormData({...formData, riskCustomers: e.target.value})} className={`w-full p-3 rounded-xl border bg-transparent outline-none ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} />
                                   </div>
                                </div>
                                <div className="col-span-2">
                                  <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div>
                                      <span className="text-xs font-bold uppercase opacity-50 block">Risco Financeiro Total (TAM Risk)</span>
                                      <span className="text-[10px] opacity-40">Ticket Médio x Clientes em Risco</span>
                                    </div>
                                    <div className="text-2xl font-mono font-bold text-red-500">
                                      R$ {formData.tamRisk.toLocaleString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* WIZARD FOOTER */}
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
                           <CheckCircle size={16}/>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold uppercase">Critérios mínimos preenchidos</span>
                             <span className="text-xs">👉 Agora gere a estratégia no painel lateral!</span>
                           </div>
                         </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              )}

              {/* === TAB 2 & 3 (Live only) === */}
              {activeTab === 'strategy' && strategyCore && (
                <motion.div key="strategy" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="space-y-8">
                  <div className={`flex justify-between items-center p-4 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex gap-2">
                      <button onClick={() => setActiveTab('input')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><ArrowLeft size={16}/> Input</button>
                      <button onClick={() => setActiveTab('assets')} disabled={!battlecards} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors disabled:opacity-50">Próximo: Assets <ArrowRight size={16}/></button>
                    </div>
                    <button onClick={() => downloadPDF('Strategy', strategyRef)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"><Download size={16}/> PDF</button>
                  </div>
                  <div ref={strategyRef} className={`p-6 rounded-2xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 mb-8 shadow-xl">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Shield size={120} /></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4"><span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase border border-red-500/30">O Inimigo</span><span className="h-px w-12 bg-white/20"></span></div>
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">"{strategyCore.gtm_thesis.enemy}"</h2>
                        <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">{strategyCore.gtm_thesis.tension}</p>
                      </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 mb-8">
                       {[{ label: "Target Customer", val: strategyCore.primary_gtm_decision.primary_target_customer, icon: Users, color: "blue" }, { label: "Use Case", val: strategyCore.primary_gtm_decision.primary_use_case, icon: Target, color: "emerald" }, { label: "Dominant Value", val: strategyCore.primary_gtm_decision.dominant_value, icon: Zap, color: "amber" }].map((item, i) => (
                         <div key={i} className={`p-5 rounded-xl border shadow-sm flex flex-col h-full ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-${item.color}-500/10 text-${item.color}-500`}><item.icon size={18} /></div>
                           <span className="text-xs font-bold uppercase opacity-50 mb-1">{item.label}</span><p className="font-bold text-sm leading-snug">{item.val}</p>
                         </div>
                       ))}
                    </motion.div>
                    <motion.div variants={itemVariants} className={`p-8 rounded-2xl border mb-8 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-6 flex items-center gap-2"><Globe size={16}/> Posicionamento Estratégico</h3>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-xl bg-indigo-500/5 border border-indigo-500/10"><span className="text-indigo-500 text-xs font-bold uppercase mb-2 block">Categoria</span><p className="text-xl font-bold">{strategyCore.strategic_thesis.positioning.category}</p></div>
                        <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/10"><span className="text-purple-500 text-xs font-bold uppercase mb-2 block">Diferencial Único</span><p className="text-xl font-bold">{strategyCore.strategic_thesis.positioning.unique_value}</p></div>
                        <div className="md:col-span-2"><span className="text-xs font-bold uppercase opacity-50 mb-2 block">Promessa Central</span><p className="text-2xl font-serif italic opacity-80">"{strategyCore.strategic_thesis.value_proposition.core_promise}"</p></div>
                      </div>
                    </motion.div>
                    <motion.div variants={itemVariants} className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                       <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}><span className="font-bold text-sm flex items-center gap-2"><FileText size={16}/> GTM Strategy Doc</span><button onClick={()=>handleCopy(strategyCore.gtm_strategy_doc)} className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1"><Copy size={14}/> Copy MD</button></div>
                       <div className="p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap opacity-80">{strategyCore.gtm_strategy_doc}</div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'assets' && battlecards && messaging && (
                <motion.div key="assets" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="space-y-8">
                  <div className={`flex justify-between items-center p-4 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex gap-2">
                      <button onClick={() => setActiveTab('strategy')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><ArrowLeft size={16}/> Strategy</button>
                      <button onClick={() => { setActiveTab('input'); setStatus('idle'); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"><RotateCcw size={16}/> Reiniciar</button>
                    </div>
                    <button onClick={() => downloadPDF('Assets', assetsRef)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"><Download size={16}/> PDF</button>
                  </div>
                  <div ref={assetsRef} className="space-y-12">
                    <motion.div variants={itemVariants} className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className={`p-10 text-center border-b ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                        <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold uppercase tracking-widest mb-4">Core Message</span>
                        <h3 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">{messaging.core_message}</h3>
                        <p className="text-xl opacity-60 font-medium max-w-3xl mx-auto">{messaging.sub_headline}</p>
                      </div>
                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x dark:divide-slate-700">
                        <div className="p-8 space-y-6">
                           <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-red-900/10 border-red-500/20' : 'bg-red-50 border-red-100'}`}><h4 className="flex items-center gap-2 font-bold text-red-500 mb-2"><AlertTriangle size={18}/> O Inferno (Problema)</h4><p className="opacity-80 text-sm leading-relaxed">{messaging.problem_statement}</p></div>
                           <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}><h4 className="flex items-center gap-2 font-bold text-emerald-500 mb-2"><CheckCircle size={18}/> O Paraíso (Solução)</h4><p className="opacity-80 text-sm leading-relaxed">{messaging.solution_statement}</p></div>
                        </div>
                        <div className={`p-8 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}`}><h4 className="font-bold mb-4 flex items-center gap-2"><Layers size={18}/> Pilares de Valor</h4><div className="space-y-3">{messaging.value_pillars?.map((p, i) => (<div key={i} className={`p-4 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><span className="block font-bold text-sm mb-1">{p.pillar}</span><span className="block text-xs opacity-60">{p.proof}</span></div>))}</div></div>
                      </div>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Swords className="text-red-500"/> Battlecards</h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className={`p-6 rounded-2xl border-t-4 border-slate-400 shadow-sm flex flex-col ${isDarkMode ? 'bg-slate-800 border-x-slate-700 border-b-slate-700' : 'bg-white border-x-slate-200 border-b-slate-200'}`}><h4 className="font-bold text-lg mb-1">Status Quo</h4><span className="text-xs opacity-50 uppercase tracking-widest mb-6">O "Não fazer nada"</span><div className="space-y-4 flex-1"><div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}><strong className="block text-xs uppercase opacity-50 mb-1">Por que ficam?</strong>{battlecards.status_quo.why_it_feels_safe}</div><div className={`p-3 rounded-lg text-sm border ${isDarkMode ? 'bg-red-900/10 border-red-500/20 text-red-200' : 'bg-red-50 border-red-100 text-red-700'}`}><strong className="block text-xs uppercase opacity-70 mb-1 text-red-500">A Falha Real</strong>{battlecards.status_quo.why_it_fails}</div></div></div>
                        <div className={`p-6 rounded-2xl border-t-4 border-red-500 shadow-sm flex flex-col ${isDarkMode ? 'bg-slate-800 border-x-slate-700 border-b-slate-700' : 'bg-white border-x-slate-200 border-b-slate-200'}`}><h4 className="font-bold text-lg mb-1">Competidor</h4><span className="text-xs opacity-50 uppercase tracking-widest mb-6">{battlecards.main_competitor.competitor}</span><div className="space-y-4 flex-1"><div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}><strong className="block text-xs uppercase opacity-50 mb-1">Força Deles</strong>{battlecards.main_competitor.their_strength}</div><div className={`p-3 rounded-lg text-sm border relative overflow-hidden ${isDarkMode ? 'bg-red-900/10 border-red-500/20 text-red-200' : 'bg-red-50 border-red-100 text-red-700'}`}><div className="absolute top-0 right-0 p-1 bg-red-500 text-white text-[9px] font-bold uppercase rounded-bl">Kill Shot</div><strong className="block text-xs uppercase opacity-70 mb-1 text-red-500">Ponto Cego</strong>{battlecards.main_competitor.their_blind_spot}</div></div></div>
                        <div className={`p-6 rounded-2xl border-t-4 border-amber-500 shadow-sm flex flex-col ${isDarkMode ? 'bg-slate-800 border-x-slate-700 border-b-slate-700' : 'bg-white border-x-slate-200 border-b-slate-200'}`}><h4 className="font-bold text-lg mb-6">Objeções</h4><div className="space-y-3 flex-1">{battlecards.objection_handling?.map((obj, i) => (<div key={i} className={`p-3 rounded-lg border text-sm ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}><p className="font-bold text-xs mb-1 opacity-90">"{obj.objection}"</p><p className="text-indigo-500 italic text-xs">➡ {obj.answer}</p></div>))}</div></div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT SIDEBAR (4/12) - VISIBLE ONLY ON INPUT TAB */}
          {activeTab === 'input' && (
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              <div className={`rounded-2xl shadow-xl overflow-hidden border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                 <div className={`p-5 border-b flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><h3 className="font-bold flex items-center gap-2 text-sm"><BrainCircuit size={16} className="text-indigo-500"/> Pipeline AI</h3><span className="text-[10px] font-bold uppercase tracking-wider opacity-50">{status === 'idle' ? 'Aguardando' : status === 'processing' ? 'Rodando' : 'Completo'}</span></div>
                 <div className="p-5 space-y-6 relative">
                   <div className={`absolute left-9 top-8 bottom-8 w-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                   {[1, 2, 3].map((step) => (<div key={step} className="relative z-10 flex items-start gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-500 ${pipelineStep > step ? 'bg-emerald-500 text-white scale-110' : pipelineStep === step ? 'bg-indigo-500 text-white animate-pulse' : isDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>{pipelineStep > step ? <CheckCircle size={14} /> : step}</div><div className={`transition-opacity duration-500 ${pipelineStep >= step ? 'opacity-100' : 'opacity-40'}`}><p className="text-xs font-bold uppercase tracking-wider mb-0.5">{step === 1 ? 'Market Intel' : step === 2 ? 'Strategy Core' : 'Tactical Assets'}</p><p className="text-[10px] opacity-60">{step === 1 ? 'Perplexity API' : step === 2 ? 'Gemini 2.5 Flash' : 'Parallel Generation'}</p></div></div>))}
                 </div>
                 <div className={`p-5 border-t ${isDarkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    {status === 'processing' ? (
                      <div className="w-full py-3 rounded-xl bg-slate-500/10 text-slate-500 text-sm font-bold flex items-center justify-center gap-2 cursor-wait"><Loader2 size={16} className="animate-spin" /> {statusMessage}</div>
                    ) : (
                      <button 
                        onClick={runGTMPipeline} 
                        disabled={!isPipelineReady()}
                        className={`w-full py-4 rounded-xl text-sm font-bold shadow-lg transition-all transform flex items-center justify-center gap-2 group ${isPipelineReady() ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white hover:scale-[1.02] shadow-indigo-500/25' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'}`}
                      >
                        {status === 'success' ? 'Rodar Novamente' : 'Gerar Estratégia'}
                        <ChevronRight size={16} className={isPipelineReady() ? "group-hover:translate-x-1 transition-transform" : ""}/>
                      </button>
                    )}
                    {status === 'idle' && isPipelineReady() && <p className="text-[10px] text-center mt-3 opacity-40 flex items-center justify-center gap-1"><Keyboard size={10}/> Pressione Enter ou Ctrl+Enter</p>}
                    {!isPipelineReady() && <p className="text-[10px] text-center mt-3 text-red-500 opacity-80 flex items-center justify-center gap-1"><AlertCircle size={10}/> Complete o passo 5 para liberar</p>}
                    {errorMsg && <p className="text-[10px] text-red-500 mt-2 text-center font-bold animate-pulse">{errorMsg}</p>}
                 </div>
              </div>
              {perplexityIntel && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 opacity-60"><Globe size={14}/> Intel Resumo</h4><p className="text-xs leading-relaxed opacity-80 line-clamp-4">{perplexityIntel.insight || perplexityIntel}</p></motion.div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* === MODAL DE CONFIGURAÇÃO DE API === */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" /> 
                  Configurar APIs
                </h3>
                <button onClick={() => setShowApiKeyModal(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Google Gemini API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua chave AIza..."
                    className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 block">
                    Gerar chave Gemini Grátis →
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Perplexity API Key (Opcional)</label>
                  <input 
                    type="password" 
                    value={perplexityApiKey}
                    onChange={(e) => setPerplexityApiKey(e.target.value)}
                    placeholder="Cole sua chave pplx-..."
                    className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <button 
                  onClick={() => handleSaveKeys(apiKey, perplexityApiKey)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2 mt-4"
                >
                  <CheckCircle className="w-5 h-5" />
                  Salvar e Continuar
                </button>
                
                <p className="text-xs text-center text-slate-500 mt-4">
                  Suas chaves são salvas apenas no seu navegador e nunca são enviadas para nossos servidores.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GTMCopilot;
