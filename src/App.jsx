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
  // comp2 e comp3 são OPCIONAIS (não incluídos em CRITICAL_FIELDS)
  CRITICAL_FIELDS: ['productName', 'description', 'stage', 'persona', 'pricing', 'churnRate', 'comp1', 'urgency'],
  WIZARD_STEPS: [
    { id: 1, title: "Produto & Visão", icon: Zap },
    { id: 2, title: "ICP & Persona", icon: UserCheck },
    { id: 3, title: "Comercial", icon: DollarSign },
    { id: 4, title: "Concorrência", icon: Swords },
    { id: 5, title: "Prioridade & Risco", icon: AlertOctagon }
  ],
  // ✅ FIX #10: Múltiplos presets
  PRESETS: {
    churn: {
      name: "Churn Buster AI",
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
      comp2: "ChurnZero",
      comp3: "Totango",
      urgency: "Kill Revenue (Crítico)",
      ticketVal: "15000",
      riskCustomers: "10",
      tamRisk: 1800000
    },
    sales: {
      name: "Sales Copilot Pro",
      productName: "Sales Copilot Pro",
      description: "IA que automatiza outreach e qualificação de leads B2B com NLP avançado.",
      stage: "Novo Produto",
      objective: "Aquisição (Novos Clientes)",
      businessType: "B2B",
      persona: "VP de Vendas / CRO",
      pricing: "8900",
      pricingModel: "Por Usuário (Seat-based)",
      churnRate: "18",
      churnType: "Logo Churn",
      comp1: "Salesforce Sales Cloud",
      comp2: "HubSpot Sales Hub",
      comp3: "Outreach.io",
      urgency: "Important (Necessário)",
      ticketVal: "8900",
      riskCustomers: "8",
      tamRisk: 854400
    },
    inventory: {
      name: "Smart Inventory AI",
      productName: "Smart Inventory AI",
      description: "Sistema preditivo que otimiza estoque e reduz stockouts em e-commerce.",
      stage: "Scale-up",
      objective: "Monetização",
      businessType: "B2B",
      persona: "COO / Supply Chain Manager",
      pricing: "12000",
      pricingModel: "Flat Fee",
      churnRate: "10",
      churnType: "Revenue Churn",
      comp1: "NetSuite Inventory",
      comp2: "TradeGecko",
      comp3: "Cin7",
      urgency: "Kill Revenue (Crítico)",
      ticketVal: "12000",
      riskCustomers: "15",
      tamRisk: 2160000
    }
  }
};

/**
 * ==============================================================================
 * MÓDULO 2: PROMPTS ENTERPRISE V2 (100% CORRIGIDO - VERSÃO COMPLETA)
 * ==============================================================================
 */
const PROMPTS = {

  INTEL: (context) => {
    const competitors = [context.comp1, context.comp2, context.comp3]
      .filter(c => c && c.trim() !== '');

    return `YOU ARE: Senior Market Intelligence Analyst
MISSION: Validate GTM assumptions using Google Search for RECENT data (2025-2026)
TOOL: You MUST use Google Search to validate facts

CONTEXT:
- Product: ${context.productName}
- Description: ${context.description}
- Market: ${context.businessType} / ${context.accountSize}
- Competitors (${competitors.length}):
  * PRIMARY: ${context.comp1 || 'Not specified'}
  ${context.comp2 ? `* SECONDARY: ${context.comp2}` : ''}
  ${context.comp3 ? `* TERTIARY: ${context.comp3}` : ''}

⚠️ CRITICAL QUALITY RULES:
1. Use REAL data from Google Search (NOT placeholder/example content)
2. NEVER include generic phrases: "example", "placeholder", "Nome da fonte"
3. ALL source_name must be real companies/publications (TechCrunch, G2, Gartner, etc)
4. ALL statements must have SPECIFIC numbers, dates, or facts
5. If you cannot find real data, set confidence to 0.4 and source_url to null

⚠️ COMPETITOR COVERAGE:
1. PRIMARY (${context.comp1}): MUST generate 1-2 claims (required)
${context.comp2 ? `2. SECONDARY (${context.comp2}): Generate 1 claim if data found` : ''}
${context.comp3 ? `3. TERTIARY (${context.comp3}): Generate 1 claim if data found` : ''}
4. Market trends: 1-2 claims about ${context.businessType} in Brazil (2025-2026)

CRITICAL INSTRUCTION: Return ONLY valid JSON. Start with { and end with }

REQUIRED JSON STRUCTURE:
{
  "market_intel": {
    "claims": [
      {
        "claim_id": "C1",
        "type": "competitor",
        "statement": "REAL factual statement about ${context.comp1 || 'competitor'} with numbers, dates, source. Example format: '${context.comp1 || 'Company'} has X active users (Y% growth YoY 2024-2025) according to [Real Source], offering [specific features found].'",
        "source_name": "REAL source name (NOT 'Nome da fonte')",
        "source_url": "URL or null",
        "retrieved_at": "2026-02-09",
        "confidence": 0.8
      }
    ],
    "notes_on_gaps": ["Specific data about ${context.productName} that you searched for but could NOT find"]
  }
}

NOW EXECUTE:
1. Use Google Search to find 3-5 REAL facts
2. Focus on: ${context.comp1}, ${context.comp2 || ''}, ${context.comp3 || ''}, ${context.businessType} market Brazil
3. Generate JSON with REAL findings (not templates)
4. Types: "competitor", "trend", "macro", "pricing"
5. Confidence: 0.4-0.9 based on source quality

RETURN ONLY JSON - NO MARKDOWN, NO EXPLANATIONS.`;
  },

  STRATEGY: (context, intel) => {
    const availableClaims = (intel?.market_intel?.claims || [])
      .map(c => c.claim_id)
      .join(', ');

    const competitors = [context.comp1, context.comp2, context.comp3]
      .filter(c => c && c.trim() !== '');

    return `YOU ARE: VP of Go-to-Market Strategy
MISSION: Generate battle plan with QUANTIFIED decisions for ${context.productName}

INPUTS:
Product: ${context.productName}
Persona: ${context.persona}
Pricing: R$${context.pricing}
Competitors (${competitors.length}):
  - PRIMARY: ${context.comp1 || 'Not specified'}
  ${context.comp2 ? `- SECONDARY: ${context.comp2}` : ''}
  ${context.comp3 ? `- TERTIARY: ${context.comp3}` : ''}
Urgency: ${context.urgency}
Churn Rate: ${context.churnRate}%

VALIDATED INTEL from Google Search:
${JSON.stringify(intel?.market_intel?.claims || [], null, 2)}

⚠️ AVAILABLE INTEL CLAIMS: ${availableClaims || 'None'}
⚠️ CRITICAL: Only cite claim IDs from this list: [${availableClaims}]
DO NOT invent C3, C4, C5 if they don't exist above.

⚠️ QUALITY REQUIREMENTS (100% MANDATORY):
1. financial_implications: MUST include EXPLICIT math with R$ amounts, %, and calculations
   Bad: "Improve ROI" | Good: "Invest R$50k (R$30k ads + R$20k sales) → 500 clients at CAC R$100 → R$150k ARR → ROI 200% in 12m, break-even 4m"
2. success_criteria: MUST have MEASURABLE metrics with target numbers
   Bad: "Improve conversion" | Good: "CAC < R$150 (current R$200), LTV/CAC > 4, Conversion > 12%"
3. unknowns_ratio: MUST be realistic (0.15-0.30), NEVER 0.0
4. plan_30_60_90: EVERY action MUST have budget OR metric
   Bad: "Launch campaign" | Good: "Launch LinkedIn: R$20k budget → 300 leads (CPL <R$67) → 30 demos (10% conv)"
5. why_now: MUST cite ONLY claims from [${availableClaims}]

CRITICAL INSTRUCTION: Return ONLY valid JSON. Start with { and end with }

REQUIRED JSON STRUCTURE:
{
  "decision_layer": {
    "context_summary": "2-3 sentences connecting QUANTITATIVE data from INTEL to ${context.productName} opportunity. MUST cite specific claim_ids from [${availableClaims}].",
    "unknowns": [
      {
        "field": "Specific missing info for ${context.productName} (e.g., 'Real CAC to acquire ${context.persona} via LinkedIn')",
        "impact": "High",
        "mitigation": "Concrete action WITH deadline and metric (e.g., 'Run A/B test with 100 leads in 14 days to validate CAC < R$X')"
      },
      {
        "field": "Viability of R$${context.pricing} pricing vs delivery cost",
        "impact": "Medium",
        "mitigation": "Specific action to reduce uncertainty"
      }
    ],
    "unknowns_ratio": 0.20,
    "strategy_allowed": true,
    "critical_decisions": [
      {
        "title": "SPECIFIC decision for ${context.productName} (NOT generic)",
        "preferred_option": {
          "option": "Recommended action WITH numbers, deadlines, budget",
          "confidence": 0.85,
          "why": "Justification citing INTEL and calculations. ONLY cite claims from [${availableClaims}]",
          "evidence_claim_ids": ["C1"],
          "financial_implications": "EXPLICIT CALCULATION (MANDATORY):\n- Investment: R$X (breakdown: R$A ads + R$B sales + R$C product)\n- Expected return: R$Y in N months\n- Assumptions: CAC R$Z, LTV R$W (based on ${context.churnRate}% churn)\n- ROI: (Y-X)/X × 100 = P%\n- Break-even: M months\nExample: 'Invest R$50k (R$30k Meta + R$20k Google) → 500 clients at CAC R$100 → R$150k ARR (${context.pricing}/mo × 500 × 12 × (1-${context.churnRate}%) retention) → ROI 200% in 12m, break-even 4m'",
          "success_criteria": "MEASURABLE metrics (MANDATORY):\n- CAC < R$X (target R$Y after optimization)\n- LTV/CAC > Z (based on ${context.churnRate}% churn)\n- Trial→Paid > W%\n- Time to value < N days\n- NPS ${context.persona} > P in 90d"
        },
        "alternative_option": {
          "option": "Viable alternative SPECIFIC to ${context.productName}",
          "risk": "QUANTIFIED risk (e.g., 'Reduces LTV by X% but accelerates adoption by Y%')",
          "when_to_consider": "Trigger condition WITH numbers: 'If CAC > R$X or Churn > Y% after 60d'"
        }
      }
    ]
  },
  "alignment_layer": {
    "product_brief": "Direction for product team SPECIFIC to ${context.productName}: prioritized features (top 3 with criteria), critical UX (based on ${context.persona} objections), necessary integrations",
    "sales_brief": "Pitch + objections SPECIFIC to ${context.persona}:\n- Discovery questions: Q1, Q2, Q3\n- Pitch deck: slides 1-5 (titles)\n- Battle card vs ${context.comp1}: our advantage WITH proof\n- Top 3 objections: O1 (answer with ROI), O2, O3",
    "leadership_brief": "Executive analysis WITH numbers:\n- Addressable TAM: R$X (${context.businessType} segment in Brazil)\n- 12m total investment: R$Y (breakdown by area)\n- Expected break-even: Z months\n- Projected ROI: W% in 12m\n- Risk: ${context.churnRate}% current churn, target X%"
  },
  "strategy_layer": {
    "gtm_thesis": {
      "enemy": "${context.comp1 || 'status quo'}. Cite strength from INTEL using ONLY available claims [${availableClaims}]",
      "tension": "SPECIFIC pain of ${context.persona} that ${context.productName} solves WITH metric",
      "why_now": "Urgency WITH data from INTEL (cite ONLY claims from [${availableClaims}]):\n- Macro: If 'macro'/'trend' claim exists in INTEL, cite real claim_id\n- Competitive: Cite available claims about competitors\n  * ${context.comp1}: cite if available\n  ${context.comp2 ? `* ${context.comp2}: cite if available` : ''}\n  ${context.comp3 ? `* ${context.comp3}: cite if available` : ''}\n- Urgency: '${context.urgency}' indicates critical need\n⚠️ DO NOT invent claim IDs"
    },
    "positioning": {
      "category": "SPECIFIC category where ${context.productName} competes",
      "unique_value": "Clear differentiation vs ${context.comp1} WITH proof"
    },
    "metrics": {
      "north_star": "ONE primary metric SPECIFIC to ${context.productName}",
      "success_metrics": [
        {"metric": "CAC", "target": "R$X → R$Y", "timeframe": "90d"},
        {"metric": "LTV/CAC", "target": "> Z", "timeframe": "12m"},
        {"metric": "Churn", "target": "${context.churnRate}% → W%", "timeframe": "180d"}
      ]
    },
    "plan_30_60_90": {
      "days_0_30": [
        "Action 1 WITH budget/target (MANDATORY): 'Launch PoC with 5 clients (criteria: GMV >R$X). Budget: R$Z/PoC. Target: 3/5 convert (60%)'",
        "Action 2 WITH KPIs: 'LinkedIn Ads: R$W budget → X ${context.persona} leads (CPL <R$Y) → Z demos'",
        "Action 3 WITH deliverable: 'Create battlecard vs ${context.comp1} + ROI calculator'"
      ],
      "days_31_60": [
        "Action 4 WITH metric: 'Collect PoC results: target X% improvement in metric Y for case study'",
        "Action 5 WITH integration: 'Integrate with [system from INTEL]. Target: A% adoption'",
        "Action 6 WITH training: 'Train sales on ROI pitch. Target: close rate B% → C%'"
      ],
      "days_61_90": [
        "Action 7 WITH launch: 'Launch ROI Guarantee (based on PoC cases). Target: reduce sales cycle X → Y days'",
        "Action 8 WITH expansion: 'Expand to segment Z. Budget: R$W. Target: A new clients'",
        "Action 9 WITH analysis: 'Analyze churn: identify top 3 causes, reduce ${context.churnRate}% → X%'"
      ]
    },
    "messaging": {
      "core_message": "≤10 words SPECIFIC to ${context.productName} and ${context.persona} pain",
      "sub_headline": "Sub-message connecting pain and urgency",
      "value_pillars": [
        {
          "pillar": "Specific pillar (e.g., 'ROI Garantido em 90 Dias')",
          "proof": "Evidence WITH numbers. NOT vague 'better ROI'"
        },
        {
          "pillar": "Specialization vs ${context.comp1}",
          "proof": "Comparison WITH data from INTEL if available"
        },
        {
          "pillar": "Integration/Speed",
          "proof": "Time WITH benchmark (e.g., 'X days vs Y weeks of ${context.comp1}')"
        }
      ]
    },
    "battlecards": {
      "main_competitor": {
        "competitor": "${context.comp1 || 'Market leader'}",
        "their_strength": "REAL strength based on INTEL (cite ONLY from [${availableClaims}]): '${context.comp1 || 'Competitor'} has X, focuses on Y, integration Z'",
        "our_kill_point": "SPECIFIC advantage of ${context.productName} WITH evidence:\n- Specialize in X vs generalist Y\n- Deliver A% better results in metric B\n- Pricing R$${context.pricing} offers ROI C% vs D%\n- Time to value: E days vs F weeks"
      }${context.comp2 || context.comp3 ? `,
      "secondary_competitors": [${context.comp2 ? `
        {
          "competitor": "${context.comp2}",
          "positioning": "How ${context.productName} differentiates from ${context.comp2} (1 sentence)",
          "when_they_win": "Scenario where ${context.comp2} wins (e.g., 'Enterprise clients with budget >R$X prefer all-in-one')",
          "our_counter": "Our response (e.g., 'We specialize in Y, delivering Z% superior ROI in specific use cases')"
        }` : ''}${context.comp2 && context.comp3 ? ',' : ''}${context.comp3 ? `
        {
          "competitor": "${context.comp3}",
          "positioning": "How ${context.productName} differentiates from ${context.comp3}",
          "when_they_win": "Scenario where ${context.comp3} wins",
          "our_counter": "Our response"
        }` : ''}
      ]` : ''},
      "objection_handling": [
        {
          "objection": "REAL objection from ${context.persona} (e.g., 'Already using ${context.comp1}')",
          "answer": "Answer WITH calculated ROI: '${context.comp1} is generalist in X (cite if available). We specialize in Y. Calculation: avoid Z problems/mo (R$W each) = save R$X/yr vs our cost R$Y/yr (ROI A%). Doesn't replace, complements focus on B they lack.'"
        },
        {
          "objection": "R$${context.pricing} pricing is high",
          "answer": "ROI WITH breakeven: 'Annual cost: R$X. Avoid Y problems (avg value R$Z each) = payback W [timeframe]. Analysis: 1 problem avoided pays annual investment. Not cost, insurance with guaranteed ROI.'"
        },
        {
          "objection": "Specific objection 3 from ${context.persona}",
          "answer": "Answer WITH proof point from INTEL or case"
        },
        {
          "objection": "Specific objection 4",
          "answer": "Answer WITH quantified comparison vs ${context.comp1}"
        },
        {
          "objection": "Specific objection 5",
          "answer": "Answer WITH timeline/speed (e.g., 'Implementation X days vs Y weeks of alternative')"
        }
      ]
    }
  }
}

CRITICAL CHECKLIST:
✅ unknowns_ratio is 0.15-0.30 (NOT 0.0)
✅ financial_implications has EXPLICIT calculations with R$, %, numbers
✅ success_criteria has MEASURABLE metrics (CAC < $X, etc)
✅ plan_30_60_90 has BUDGETS/TARGETS in each action
✅ why_now CITES macro trends using ONLY [${availableClaims}]
✅ value_pillars have QUANTIFIED proof
✅ objection_handling includes ROI/payback calculations
✅ ALL content SPECIFIC to ${context.productName}
✅ NEVER cite claim IDs not in [${availableClaims}]

Generate strategy NOW. RETURN ONLY JSON.`;
  }
};

/**
 * ==============================================================================
 * MÓDULO 3: SERVICES (GOOGLE SEARCH + VALIDAÇÕES DE QUALIDADE)
 * ==============================================================================
 */
const GeminiService = {
  cleanJSON: (text) => {
    if (!text) return null;

    let clean = text
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .replace(/^json\n/i, '');

    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(clean);
    } catch (e) {
      try {
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
      return !!(data.decision_layer && data.alignment_layer && data.strategy_layer);
    }

    return false;
  },

  // ✅ FIX #4: Validar INTEL não tem conteúdo genérico
  validateIntelQuality: (data) => {
    const warnings = [];

    data.market_intel.claims.forEach((claim, i) => {
      // Check for generic/placeholder content
      const genericPatterns = [
        'example', 'placeholder', 'Nome da fonte', 'Fonte', 
        'Ex:', 'e.g.', 'such as', 'like'
      ];

      const hasGeneric = genericPatterns.some(pattern => 
        claim.statement.toLowerCase().includes(pattern.toLowerCase()) ||
        claim.source_name.toLowerCase().includes(pattern.toLowerCase())
      );

      if (hasGeneric) {
        warnings.push(`Claim ${claim.claim_id}: Contains generic/placeholder content`);
      }

      // Check for specific numbers
      const hasNumbers = /\d+/.test(claim.statement);
      if (!hasNumbers) {
        warnings.push(`Claim ${claim.claim_id}: Missing specific numbers/data`);
      }

      // Check confidence
      if (claim.confidence > 0.6 && !claim.source_url) {
        warnings.push(`Claim ${claim.claim_id}: High confidence (${claim.confidence}) but no source URL`);
      }
    });

    if (warnings.length > 0) {
      console.warn('⚠️ INTEL Quality Issues:', warnings);
    }

    return warnings;
  },

  // ✅ FIX #5: Validar financial_implications tem cálculos
  // ✅ FIX #6: Validar plan_30_60_90 tem métricas
  validateStrategyQuality: (data) => {
    const warnings = [];

    // Validate critical_decisions have financial calculations
    data.decision_layer.critical_decisions.forEach((d, i) => {
      const finImpl = d.preferred_option.financial_implications || '';
      const hasCalculations = /R\$\d+/.test(finImpl) && 
                             /\d+%/.test(finImpl) && 
                             /\d+\s*(meses|dias|months|days)/.test(finImpl);

      if (!hasCalculations) {
        warnings.push(`Decision ${i+1} (${d.title}): financial_implications missing explicit calculations (R$, %, timeframes)`);
      }

      const criteria = d.preferred_option.success_criteria || '';
      const hasMeasurableMetrics = /CAC|LTV|R\$\d+|\d+%|>\s*\d+|<\s*\d+/.test(criteria);

      if (!hasMeasurableMetrics) {
        warnings.push(`Decision ${i+1}: success_criteria missing measurable metrics (CAC < R$X, etc)`);
      }
    });

    // Validate plan_30_60_90 actions have budgets/metrics
    ['days_0_30', 'days_31_60', 'days_61_90'].forEach(period => {
      data.strategy_layer.plan_30_60_90[period].forEach((action, i) => {
        const hasMetrics = /R\$\d+|\d+%|\d+\s*(leads|clientes|demos|clients|conversão)/.test(action);

        if (!hasMetrics) {
          warnings.push(`${period} Action ${i+1}: Missing budget or metric - "${action.substring(0, 50)}..."`);
        }
      });
    });

    // Validate unknowns_ratio is realistic
    const ratio = data.decision_layer.unknowns_ratio;
    if (ratio === 0.0) {
      warnings.push('unknowns_ratio is 0.0 (unrealistic - every business has uncertainties)');
    } else if (ratio < 0.10) {
      warnings.push(`unknowns_ratio is ${ratio} (suspiciously low - typical range 0.15-0.30)`);
    }

    if (warnings.length > 0) {
      console.warn('⚠️ STRATEGY Quality Issues:', warnings);
    }

    return warnings;
  },

  call: async (apiKey, systemPrompt, userPrompt, expectedType, retryCount = 0) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`;

    if (!apiKey || apiKey.length < 30) {
      throw new Error("API Key inválida");
    }

    const payload = {
      contents: [{ 
         role: "user", 
         parts: [{ 
           text: `${systemPrompt}\n\n${userPrompt}\n\nREMINDER: Return ONLY JSON starting with { and ending with }. No markdown. No explanations.` 
         }] 
       }],
      tools: [{ google_search: {} }],
      generationConfig: { 
        maxOutputTokens: 8192, 
        temperature: 0.1
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

      // ✅ FIX #9: Expandir retry logic para erros temporários
      const RETRYABLE_ERRORS = [429, 500, 502, 503, 504];
      if (RETRYABLE_ERRORS.includes(response.status) && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`⚠️ HTTP ${response.status} - Retry ${retryCount + 1}/3 in ${delay}ms`);
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

      let parsed = null;

      try {
        parsed = JSON.parse(text);
        console.log("✅ Direct parse SUCCESS");
      } catch (e) {
        console.warn("⚠️ Direct parse failed, trying cleanup...");

        parsed = GeminiService.cleanJSON(text);

        if (parsed) {
          console.log("✅ CleanJSON SUCCESS");
        } else {
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

      if (!GeminiService.validateSchema(parsed, expectedType)) {
        console.error("❌ Schema validation failed");
        console.error("Parsed data:", JSON.stringify(parsed, null, 2).substring(0, 500));
        throw new Error(`JSON válido mas estrutura incorreta para tipo '${expectedType}'`);
      }

      console.log("✅ Parse + Validation SUCCESS");

      // ✅ Run quality validations (log warnings, don't throw)
      if (expectedType === 'intel') {
        GeminiService.validateIntelQuality(parsed);
      } else if (expectedType === 'strategy') {
        GeminiService.validateStrategyQuality(parsed);
      }

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

  // ✅ FIX #10: Múltiplos presets com seleção
  const loadPreset = (presetKey) => {
    const preset = CONFIG.PRESETS[presetKey];
    if (preset) {
      setFormData(prev => ({ ...prev, ...preset }));
      setShowPresets(false);
      addLog(`Preset '${preset.name}' loaded.`, 'cmd');
    }
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

      const intelRes = await GeminiService.call(
        apiKey, 
        PROMPTS.INTEL(formData), 
        "Execute Market Intel Search using Google.", 
        'intel'
      );

      if (!intelRes) throw new Error("Intel Generation Failed");

      setIntelData(intelRes);
      addLog(`Intel Received: ${intelRes.market_intel.claims.length} verified claims.`, 'success');

      setPipelineStep(2);
      setStatusMessage('🧠 Decision Engine...');
      addLog("Step 2: Running Decision Engine & Gating...");

      const strategyRes = await GeminiService.call(
        apiKey, 
        PROMPTS.STRATEGY(formData, intelRes), 
        "Execute Strategy Generation.", 
        'strategy'
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
              <h1 className="text-lg font-bold leading-none">GTM Copilot <span className="text-indigo-500 text-xs align-top">V2</span></h1>
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
                   activeTab === tab.id 
                     ? 'bg-indigo-600 text-white shadow-md' 
                     : tab.disabled 
                       ? 'opacity-30 cursor-not-allowed' 
                       : 'opacity-60 hover:opacity-100'
                 }`}
               >
                 <tab.icon size={16}/> {tab.label}
               </button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT/CENTER AREA */}
          <div className={activeTab === 'input' ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <AnimatePresence mode="wait">

              {/* TAB 1: INPUT WIZARD */}
              {activeTab === 'input' && (
                <motion.div 
                  key="wizard" 
                  initial={{opacity: 0, y: 20}} 
                  animate={{opacity: 1, y: 0}} 
                  exit={{opacity: 0, y: -20}} 
                  transition={{duration: 0.3}}
                  className={`rounded-3xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                >
                  {/* Progress Bar */}
                  <div className="h-1 bg-slate-100 dark:bg-slate-700">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" 
                      animate={{width: `${(currentStep / 5) * 100}%`}}
                      transition={{duration: 0.3}}
                    />
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        {React.createElement(CONFIG.WIZARD_STEPS[currentStep-1].icon, { className: "text-indigo-500", size: 28 })}
                        {CONFIG.WIZARD_STEPS[currentStep-1].title}
                      </h2>
                      <span className="text-xs font-bold uppercase opacity-40 tracking-wider">Step {currentStep} / 5</span>
                    </div>

                    {/* Wizard Steps */}
                    <div className="min-h-[400px] relative">
                      <AnimatePresence custom={direction} mode="wait">
                        <motion.div 
                          key={currentStep}
                          custom={direction}
                          variants={variants.wizard}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{duration: 0.3, ease: 'easeInOut'}}
                          className="absolute inset-0 space-y-6"
                        >
                          {/* STEP 1: Produto & Visão */}
                          {currentStep === 1 && (
                            <>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Nome do Produto *</label>
                                <input 
                                  value={formData.productName} 
                                  onChange={e=>handleInputChange('productName', e.target.value)} 
                                  className={inputClass(errors.productName)} 
                                  placeholder="Ex: Revenue Copilot AI"
                                />
                                {errors.productName && <span className="text-red-500 text-xs mt-1 block">Campo obrigatório</span>}
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Descrição *</label>
                                <textarea 
                                  value={formData.description} 
                                  onChange={e=>handleInputChange('description', e.target.value)} 
                                  className={`${inputClass(errors.description)} h-32 resize-none`} 
                                  placeholder="O que faz e qual o diferencial principal?"
                                />
                                {errors.description && <span className="text-red-500 text-xs mt-1 block">Campo obrigatório</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Estágio</label>
                                  <select value={formData.stage} onChange={e=>handleInputChange('stage', e.target.value)} className={inputClass()}>
                                    <option>Novo Produto</option>
                                    <option>Scale-up</option>
                                    <option>Pivot</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Tipo</label>
                                  <select value={formData.businessType} onChange={e=>handleInputChange('businessType', e.target.value)} className={inputClass()}>
                                    <option>B2B</option>
                                    <option>B2C</option>
                                    <option>B2B2C</option>
                                  </select>
                                </div>
                              </div>
                            </>
                          )}

                          {/* STEP 2: ICP & Persona */}
                          {currentStep === 2 && (
                            <>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Persona Principal *</label>
                                <input 
                                  value={formData.persona} 
                                  onChange={e=>handleInputChange('persona', e.target.value)} 
                                  className={inputClass(errors.persona)} 
                                  placeholder="Ex: VP de Vendas / CRO"
                                />
                                {errors.persona && <span className="text-red-500 text-xs mt-1 block">Campo obrigatório</span>}
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Porte da Conta</label>
                                <select value={formData.accountSize} onChange={e=>handleInputChange('accountSize', e.target.value)} className={inputClass()}>
                                  <option value="">Selecione...</option>
                                  <option>SMB (Small Business)</option>
                                  <option>Mid-Market</option>
                                  <option>Enterprise</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Nº Clientes Atuais</label>
                                <input 
                                  type="number"
                                  value={formData.numCustomers} 
                                  onChange={e=>handleInputChange('numCustomers', e.target.value)} 
                                  className={inputClass()} 
                                  placeholder="Ex: 150"
                                />
                              </div>
                            </>
                          )}

                          {/* STEP 3: Comercial */}
                          {currentStep === 3 && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Pricing (R$) *</label>
                                  <input 
                                    type="number"
                                    value={formData.pricing} 
                                    onChange={e=>handleInputChange('pricing', e.target.value)} 
                                    className={inputClass(errors.pricing)} 
                                    placeholder="Ex: 5000"
                                  />
                                  {errors.pricing && <span className="text-red-500 text-xs mt-1 block">Campo obrigatório</span>}
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Modelo</label>
                                  <select value={formData.pricingModel} onChange={e=>handleInputChange('pricingModel', e.target.value)} className={inputClass()}>
                                    <option>Por Usuário (Seat-based)</option>
                                    <option>Flat Fee</option>
                                    <option>Usage-based</option>
                                    <option>Híbrido</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Churn Rate (%)</label>
                                  <input 
                                    type="number"
                                    value={formData.churnRate} 
                                    onChange={e=>handleInputChange('churnRate', e.target.value)} 
                                    className={inputClass()} 
                                    placeholder="Ex: 15"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Tipo de Churn</label>
                                  <select value={formData.churnType} onChange={e=>handleInputChange('churnType', e.target.value)} className={inputClass()}>
                                    <option>Logo Churn</option>
                                    <option>Revenue Churn</option>
                                    <option>Net Dollar Retention</option>
                                  </select>
                                </div>
                              </div>
                            </>
                          )}

                          {/* STEP 4: Concorrência */}
                          {currentStep === 4 && (
                            <>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Concorrente Principal *</label>
                                <input 
                                  value={formData.comp1} 
                                  onChange={e=>handleInputChange('comp1', e.target.value)} 
                                  className={inputClass(errors.comp1)} 
                                  placeholder="Ex: Salesforce Sales Cloud"
                                />
                                {errors.comp1 && <span className="text-red-500 text-xs mt-1 block">Campo obrigatório</span>}
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Concorrente 2 (Opcional)</label>
                                <input 
                                  value={formData.comp2} 
                                  onChange={e=>handleInputChange('comp2', e.target.value)} 
                                  className={inputClass()} 
                                  placeholder="Ex: HubSpot Sales Hub"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Concorrente 3 (Opcional)</label>
                                <input 
                                  value={formData.comp3} 
                                  onChange={e=>handleInputChange('comp3', e.target.value)} 
                                  className={inputClass()} 
                                  placeholder="Ex: Pipedrive"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Onde perdemos?</label>
                                <textarea 
                                  value={formData.whereLose} 
                                  onChange={e=>handleInputChange('whereLose', e.target.value)} 
                                  className={`${inputClass()} h-24 resize-none`} 
                                  placeholder="Cenários onde perdemos para os concorrentes"
                                />
                              </div>
                            </>
                          )}

                          {/* STEP 5: Prioridade & Risco */}
                          {currentStep === 5 && (
                            <>
                              <div>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Urgência *</label>
                                <select value={formData.urgency} onChange={e=>handleInputChange('urgency', e.target.value)} className={inputClass(errors.urgency)}>
                                  <option value="">Selecione...</option>
                                  <option>Kill Revenue (Crítico)</option>
                                  <option>Important (Necessário)</option>
                                  <option>Nice to Have</option>
                                </select>
                                {errors.urgency && <span className="text-red-500 text-xs mt-1 block">Campo obrigatório</span>}
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Ticket Médio (R$)</label>
                                  <input 
                                    type="number"
                                    value={formData.ticketVal} 
                                    onChange={e=>handleInputChange('ticketVal', e.target.value)} 
                                    className={inputClass()} 
                                    placeholder="Ex: 5000"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Período</label>
                                  <select value={formData.ticketPeriod} onChange={e=>handleInputChange('ticketPeriod', e.target.value)} className={inputClass()}>
                                    <option>Mensal (MRR)</option>
                                    <option>Anual (ARR)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Clientes em Risco</label>
                                  <input 
                                    type="number"
                                    value={formData.riskCustomers} 
                                    onChange={e=>handleInputChange('riskCustomers', e.target.value)} 
                                    className={inputClass()} 
                                    placeholder="Ex: 10"
                                  />
                                </div>
                              </div>
                              {formData.tamRisk > 0 && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                  <div className="text-sm font-bold text-red-500 mb-1">TAM em Risco</div>
                                  <div className="text-2xl font-bold text-red-500">R$ {formData.tamRisk.toLocaleString('pt-BR')}</div>
                                </div>
                              )}
                            </>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={handlePrev} 
                        disabled={currentStep === 1}
                        className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <ArrowLeft size={16}/> Anterior
                      </button>
                      {currentStep < 5 ? (
                        <button 
                          onClick={handleNext}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                        >
                          Próximo <ArrowRight size={16}/>
                        </button>
                      ) : (
                        <button 
                          onClick={runPipeline}
                          disabled={status === 'processing'}
                          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                          {status === 'processing' ? (
                            <><Loader2 size={16} className="animate-spin"/> Processando...</>
                          ) : (
                            <><Play size={16}/> Gerar Estratégia</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: STRATEGY */}
              {activeTab === 'strategy' && strategyData && (
                <motion.div 
                  key="strategy" 
                  initial={{opacity: 0, y: 20}} 
                  animate={{opacity: 1, y: 0}} 
                  exit={{opacity: 0, y: -20}}
                  className="space-y-6"
                >
                  {/* Context Summary */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Target size={20} className="text-indigo-500"/> 
                      Context & Gating
                    </h3>
                    <p className="opacity-80 leading-relaxed mb-4">{strategyData.decision_layer?.context_summary}</p>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900">
                      <div className="flex-1">
                        <div className="text-xs opacity-60 mb-1">Unknowns Ratio</div>
                        <div className="text-2xl font-bold">{(strategyData.decision_layer.unknowns_ratio * 100).toFixed(1)}%</div>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-bold text-sm ${strategyData.decision_layer.strategy_allowed ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {strategyData.decision_layer.strategy_allowed ? '✅ APPROVED' : '❌ BLOCKED'}
                      </div>
                    </div>
                  </div>

                  {/* ✅ FIX #7: INTEL Claims Visíveis */}
                  {intelData?.market_intel?.claims && intelData.market_intel.claims.length > 0 && (
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <h4 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase opacity-60">
                        <Database size={16}/> Verified Intel Claims (Google Search)
                      </h4>
                      <div className="space-y-3">
                        {intelData.market_intel.claims.map(claim => (
                          <div key={claim.claim_id} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-indigo-500 text-sm">[{claim.claim_id}] {claim.type}</span>
                              <span className="text-xs opacity-60">Confidence: {(claim.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-sm opacity-80 mb-2">{claim.statement}</p>
                            <div className="flex items-center gap-2 text-xs opacity-60">
                              <ExternalLink size={12}/>
                              <span>Source: {claim.source_name}</span>
                              {claim.source_url && (
                                <a href={claim.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline ml-2">
                                  View →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GTM Thesis */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Briefcase size={20} className="text-indigo-500"/> 
                      GTM Thesis
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">Enemy</h4>
                        <p className="opacity-80">{strategyData.strategy_layer?.gtm_thesis?.enemy}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">Tension</h4>
                        <p className="opacity-80">{strategyData.strategy_layer?.gtm_thesis?.tension}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">Why Now</h4>
                        <p className="opacity-80 whitespace-pre-line">{strategyData.strategy_layer?.gtm_thesis?.why_now}</p>
                      </div>
                    </div>
                  </div>

                  {/* Positioning */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Layers size={20} className="text-indigo-500"/> 
                      Positioning
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">Category</h4>
                        <p className="opacity-80">{strategyData.strategy_layer?.positioning?.category}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">Unique Value</h4>
                        <p className="opacity-80">{strategyData.strategy_layer?.positioning?.unique_value}</p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ FIX #8: Plan 30-60-90 COM COPY BUTTON */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Clock size={20} className="text-indigo-500"/> 
                        Plan 30-60-90
                      </h3>
                      <button 
                        onClick={() => copyToClipboard(JSON.stringify(strategyData.strategy_layer.plan_30_60_90, null, 2), 'Plan 30-60-90')}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
                      >
                        {copiedItem === 'Plan 30-60-90' ? (
                          <><Check size={14}/> Copiado!</>
                        ) : (
                          <><Copy size={14}/> Copy JSON</>
                        )}
                      </button>
                    </div>
                    {['days_0_30', 'days_31_60', 'days_61_90'].map(period => (
                      <div key={period} className="mb-6 last:mb-0">
                        <h4 className="font-bold mb-3 text-lg capitalize bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                          {period.replace(/_/g, ' ').replace('days', 'Days')}
                        </h4>
                        <ul className="space-y-2">
                          {strategyData.strategy_layer.plan_30_60_90[period].map((action, i) => (
                            <li key={i} className="flex gap-3 items-start">
                              <ChevronRight size={16} className="text-indigo-500 shrink-0 mt-1"/> 
                              <span className="opacity-80 text-sm leading-relaxed">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  {strategyData.strategy_layer?.metrics && (
                    <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-indigo-500"/> 
                        Success Metrics
                      </h3>
                      <div className="mb-6">
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">North Star</h4>
                        <p className="text-lg font-bold text-indigo-500">{strategyData.strategy_layer.metrics.north_star}</p>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        {strategyData.strategy_layer.metrics.success_metrics?.map((m, i) => (
                          <div key={i} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs uppercase opacity-60 mb-1">{m.metric}</div>
                            <div className="font-bold text-lg">{m.target}</div>
                            <div className="text-xs opacity-60 mt-1">{m.timeframe}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: ASSETS */}
              {activeTab === 'assets' && strategyData?.strategy_layer && (
                <motion.div 
                  key="assets" 
                  initial={{opacity: 0, y: 20}} 
                  animate={{opacity: 1, y: 0}} 
                  exit={{opacity: 0, y: -20}}
                  className="space-y-6"
                >
                  {/* Messaging */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <MessageSquare size={20} className="text-indigo-500"/> 
                      Messaging
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">Core Message</h4>
                        <p className="text-2xl font-bold text-indigo-500">{strategyData.strategy_layer.messaging?.core_message}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-2">Sub-headline</h4>
                        <p className="opacity-80">{strategyData.strategy_layer.messaging?.sub_headline}</p>
                      </div>
                    </div>
                  </div>

                  {/* Value Pillars */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <TrendingUp size={20} className="text-indigo-500"/> 
                      Value Pillars
                    </h3>
                    <div className="grid gap-6">
                      {strategyData.strategy_layer.messaging?.value_pillars?.map((pillar, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
                          <h4 className="font-bold text-lg mb-2">{pillar.pillar}</h4>
                          <p className="opacity-80 text-sm">{pillar.proof}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Competitor Battlecard */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Swords size={20} className="text-red-500"/> 
                      Battlecard: {strategyData.strategy_layer.battlecards?.main_competitor?.competitor}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h4 className="font-bold text-sm mb-3 text-red-500 flex items-center gap-2">
                          <AlertTriangle size={16}/> Their Strength
                        </h4>
                        <p className="text-sm opacity-80">{strategyData.strategy_layer.battlecards.main_competitor.their_strength}</p>
                      </div>
                      <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="font-bold text-sm mb-3 text-emerald-500 flex items-center gap-2">
                          <Target size={16}/> Our Kill Point
                        </h4>
                        <p className="text-sm opacity-80 whitespace-pre-line">{strategyData.strategy_layer.battlecards.main_competitor.our_kill_point}</p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ FIX #1: SECONDARY COMPETITORS RENDERIZADOS */}
                  {strategyData.strategy_layer.battlecards?.secondary_competitors && strategyData.strategy_layer.battlecards.secondary_competitors.length > 0 && (
                    <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Building2 size={20} className="text-amber-500"/> 
                        Secondary Competitors
                      </h3>
                      <div className="space-y-6">
                        {strategyData.strategy_layer.battlecards.secondary_competitors.map((comp, i) => (
                          <div key={i} className="p-6 rounded-2xl border border-slate-300 dark:border-slate-600">
                            <h4 className="font-bold text-lg mb-3 text-amber-500">{comp.competitor}</h4>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="font-bold opacity-60">Positioning: </span>
                                <span className="opacity-80">{comp.positioning}</span>
                              </div>
                              <div>
                                <span className="font-bold opacity-60">When They Win: </span>
                                <span className="opacity-80">{comp.when_they_win}</span>
                              </div>
                              <div>
                                <span className="font-bold opacity-60">Our Counter: </span>
                                <span className="opacity-80">{comp.our_counter}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objection Handling */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <MessageSquare size={20} className="text-indigo-500"/> 
                      Objection Handling
                    </h3>
                    <div className="space-y-4">
                      {strategyData.strategy_layer.battlecards?.objection_handling?.map((obj, i) => (
                        <div key={i} className="p-5 rounded-xl border border-slate-300 dark:border-slate-600 hover:border-indigo-500 transition-all">
                          <div className="font-bold text-red-500 mb-3 flex items-center gap-2">
                            <AlertCircle size={16}/> "{obj.objection}"
                          </div>
                          <div className="text-sm opacity-80 leading-relaxed">{obj.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alignment Briefs */}
                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Users size={20} className="text-indigo-500"/> 
                      Alignment Briefs
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-3 flex items-center gap-2">
                          <FileText size={14}/> Product Brief
                        </h4>
                        <p className="text-sm opacity-80 whitespace-pre-line">{strategyData.alignment_layer?.product_brief}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-3 flex items-center gap-2">
                          <Users size={14}/> Sales Brief
                        </h4>
                        <p className="text-sm opacity-80 whitespace-pre-line">{strategyData.alignment_layer?.sales_brief}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase opacity-60 mb-3 flex items-center gap-2">
                          <Briefcase size={14}/> Leadership Brief
                        </h4>
                        <p className="text-sm opacity-80 whitespace-pre-line">{strategyData.alignment_layer?.leadership_brief}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* SIDEBAR (apenas em TAB 1) */}
          {activeTab === 'input' && (
            <div className="lg:col-span-4 space-y-6">

              {/* Pipeline Logs */}
              <PipelineLogs logs={logs} status={status} />

              {/* Pipeline Control COM DROPDOWN PRESETS (FIX #10) */}
              <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className="text-sm font-bold uppercase opacity-60 mb-4 flex items-center gap-2">
                  <Activity size={14}/> Pipeline Control
                </h3>

                {/* Dropdown de Presets */}
                <div className="mb-4 relative">
                  <button 
                    onClick={() => setShowPresets(!showPresets)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    <span>📋 Load Preset</span>
                    <ChevronRight size={16} className={`transform transition-transform ${showPresets ? 'rotate-90' : ''}`}/>
                  </button>
                  {showPresets && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xl z-50">
                      {Object.entries(CONFIG.PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => loadPreset(key)}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors mb-1 last:mb-0"
                        >
                          <div className="font-bold text-sm">{preset.name}</div>
                          <div className="text-xs opacity-60">{preset.stage} • {preset.persona}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={runPipeline}
                  disabled={status === 'processing' || !Validation.isPipelineReady(formData)}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  {status === 'processing' ? (
                    <><Loader2 size={16} className="animate-spin"/> Processing...</>
                  ) : (
                    <><Play size={16}/> Gerar Estratégia</>
                  )}
                </button>

                {errorMsg && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16}/> {errorMsg}
                  </div>
                )}

                {/* Completude Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="opacity-60">Completude</span>
                    <span className="font-bold">{((CONFIG.CRITICAL_FIELDS.filter(f => formData[f]).length / CONFIG.CRITICAL_FIELDS.length) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{width: `${((CONFIG.CRITICAL_FIELDS.filter(f => formData[f]).length / CONFIG.CRITICAL_FIELDS.length) * 100)}%`}}
                    />
                  </div>
                  <div className="mt-2 text-xs opacity-60">
                    {CONFIG.CRITICAL_FIELDS.filter(f => formData[f]).length} / {CONFIG.CRITICAL_FIELDS.length} campos obrigatórios
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API KEY MODAL */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div 
            initial={{opacity: 0}} 
            animate={{opacity: 1}} 
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowApiKeyModal(false)}
          >
            <motion.div 
              initial={{scale: 0.9, opacity: 0}} 
              animate={{scale: 1, opacity: 1}} 
              exit={{scale: 0.9, opacity: 0}}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Gemini API Key</h3>
                  <p className="text-sm opacity-60">Configure sua chave para usar o Google Search</p>
                </div>
                <button 
                  onClick={() => setShowApiKeyModal(false)} 
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <XCircle size={20}/>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase opacity-60 mb-2 block">API Key</label>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={e => {
                      setApiKey(e.target.value);
                      localStorage.setItem(CONFIG.STORAGE_KEYS.API_GEMINI, e.target.value);
                    }}
                    className={inputClass()}
                    placeholder="AIzaSy..."
                  />
                </div>

                <button 
                  onClick={testApiKey}
                  disabled={testingKey || !apiKey}
                  className="w-full py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {testingKey ? (
                    <><Loader2 size={16} className="animate-spin"/> Testando...</>
                  ) : (
                    <><Check size={16}/> Test API Key</>
                  )}
                </button>

                <div className="text-xs opacity-60 space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="flex items-center gap-2">
                    <ExternalLink size={12}/>
                    Obtenha sua chave em: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Google AI Studio</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Lock size={12}/>
                    A chave é armazenada apenas no seu navegador (localStorage)
                  </p>
                  <p className="flex items-center gap-2">
                    <Globe size={12}/>
                    Usada para consultas com Google Search integrado
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GTMCopilot;
