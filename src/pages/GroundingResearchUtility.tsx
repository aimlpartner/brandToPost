import React, { useState } from 'react';

interface TypographyRules {
  heading_font_size: string;
  heading_line_height: string;
  heading_font_weight: string;
}

interface LayoutBlueprint {
  blueprint_id: string;
  platform: 'linkedin' | 'x' | 'instagram' | 'reddit';
  content_intent: string;
  ideal_text_length: 'short' | 'medium' | 'long';
  composition_archetype: string;
  grid_layout_axis: string;
  negative_space_description: string;
  typography_rules: TypographyRules;
  cultural_justification: string;
}

interface ResearchApiResponse {
  success: boolean;
  count: number;
  duplicatesDetected: number;
  localPath: string;
  dbCollection: string;
  dbSavedCount: number;
  blueprints: LayoutBlueprint[];
  error?: string;
}

const PLATFORMS = [
  { key: 'linkedin', name: 'LinkedIn (Carousels & Infographics)' },
  { key: 'x', name: 'X / Twitter (Quote-Cards & Stat Containers)' },
  { key: 'instagram', name: 'Instagram (Micro-Copy & Panoramas)' },
  { key: 'reddit', name: 'Reddit (Subreddit-Native Conversational)' },
] as const;

export function GroundingResearchUtility() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ResearchApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const handleExecuteResearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);

    addLog('[*] Initializing 4-Stage Sequential Per-Platform Grounded Research Operation...');
    addLog('[*] Each platform batch executes in isolation for max grounding accuracy (25 templates per channel)...');

    let allBlueprints: LayoutBlueprint[] = [];
    let usedDescriptors: string[] = [];

    try {
      // Execute 4 sequential calls for each platform
      for (let i = 0; i < PLATFORMS.length; i++) {
        const p = PLATFORMS[i];
        const stepNum = i + 1;
        setCurrentStep(`Batch ${stepNum}/4: Researching ${p.name}...`);
        addLog(`[*] [Batch ${stepNum}/4] Launching Phase A Grounded Search + Phase B Structuring for ${p.key.toUpperCase()}...`);

        const batchRes = await fetch('/api/research-blueprints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: p.key,
            usedDescriptors
          })
        });

        if (!batchRes.ok) {
          const errJson = await batchRes.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP ${batchRes.status} on ${p.key} batch.`);
        }

        const batchData = await batchRes.json();
        if (!batchData.success || !Array.isArray(batchData.blueprints)) {
          throw new Error(batchData.error || `Failed to extract blueprints for ${p.key}`);
        }

        const fetchedItems: LayoutBlueprint[] = batchData.blueprints;
        allBlueprints = [...allBlueprints, ...fetchedItems];
        
        // Track descriptors for cross-platform de-duplication
        const newDescriptors = fetchedItems.map(
          (item) => `${item.composition_archetype} | ${item.grid_layout_axis}`
        );
        usedDescriptors = [...usedDescriptors, ...newDescriptors];

        addLog(`[✓] [Batch ${stepNum}/4] Successfully extracted ${fetchedItems.length} blueprints for ${p.key.toUpperCase()}!`);
      }

      // Final Step: Execute Twin Persistence Hooks
      setCurrentStep('Persisting 100 Blueprints to Disk & Database...');
      addLog(`[*] All 4 platform batches complete (${allBlueprints.length} total blueprints). Executing Twin Persistence Hooks...`);

      const saveRes = await fetch('/api/research-blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_all',
          allBlueprints
        })
      });

      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${saveRes.status} on final save hook.`);
      }

      const saveData: ResearchApiResponse = await saveRes.json();
      if (!saveData.success) {
        throw new Error(saveData.error || 'Failed during final persistence transaction.');
      }

      addLog(`[✓] File system hook: Saved raw JSON dataset to ${saveData.localPath}`);
      addLog(`[✓] Database hook: Upserted ${saveData.dbSavedCount} blueprint documents into '${saveData.dbCollection}' collection.`);
      addLog(
        saveData.duplicatesDetected > 0
          ? `[!] ${saveData.duplicatesDetected} near-duplicate archetype combinations flagged during final audit.`
          : `[✓] Zero duplicate layout combinations detected across the 100-item dataset!`
      );
      addLog('[✓] Sequential 100-item blueprint extraction & persistence completed successfully!');

      setResult(saveData);
    } catch (err: any) {
      const errMsg = err.message || 'An unexpected error occurred during sequential research execution.';
      setError(errMsg);
      addLog(`[✗] ERROR: ${errMsg}`);
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  const platformStats = result?.blueprints ? result.blueprints.reduce<Record<string, number>>((acc, bp) => {
    acc[bp.platform] = (acc[bp.platform] || 0) + 1;
    return acc;
  }, {}) : null;

  return (
    <div className="min-h-screen bg-[#08080C] text-slate-200 p-6 md:p-10 font-mono flex flex-col justify-start items-center">
      <div className="w-full max-w-5xl bg-[#0F0F16] border border-slate-800 rounded-lg p-6 shadow-2xl space-y-6">

        {/* Header */}
        <div className="border-b border-slate-800 pb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
              Grounding Web Research Utility
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sequential 4-Batch Pipeline: 25 LinkedIn → 25 X → 25 Instagram → 25 Reddit (100 Blueprints Total)
            </p>
          </div>
          <div className="text-xs px-3 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded">
            Standalone Operational Tool
          </div>
        </div>

        {/* Control Panel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#08080C] p-4 rounded border border-slate-800/80">
          <button
            onClick={handleExecuteResearch}
            disabled={loading}
            className={`px-6 py-3 text-sm font-semibold rounded border transition-all duration-200 flex items-center justify-center gap-3 ${
              loading
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/30'
            }`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? currentStep || 'Executing Sequential Batches...' : 'Execute Grounding Research & Save 100 Data Blueprints'}
          </button>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Status: <span className={loading ? 'text-amber-400 font-bold' : error ? 'text-rose-400' : result ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {loading ? 'Sequential Extraction Active...' : error ? 'Failed' : result ? 'Complete' : 'Idle'}
            </span>
          </div>
        </div>

        {/* Terminal Box */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>Terminal Output Stream</span>
            <span>{logs.length} lines</span>
          </div>
          <div className="w-full h-72 bg-[#040406] border border-slate-800 rounded p-4 overflow-y-auto text-xs font-mono text-emerald-400/90 leading-relaxed shadow-inner space-y-1">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">
                [*] Terminal idle. Click the button above to launch the 4-batch sequential research pipeline.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={log.includes('ERROR') || log.includes('[✗]') ? 'text-rose-400 font-semibold' : log.includes('[!]') ? 'text-amber-400 font-semibold' : log.includes('[✓]') ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Data Summary */}
        {result && (
          <div className="border border-slate-800 rounded bg-[#08080C] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Research Data Summary</h3>
              <span className="text-xs text-emerald-400 font-bold">{result.count} Blueprints Extracted</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-[#0F0F16] p-3 rounded border border-slate-800">
                <div className="text-slate-400">Local Disk File</div>
                <div className="text-slate-200 font-semibold truncate mt-1">{result.localPath}</div>
              </div>
              <div className="bg-[#0F0F16] p-3 rounded border border-slate-800">
                <div className="text-slate-400">Database Table</div>
                <div className="text-slate-200 font-semibold truncate mt-1">{result.dbCollection}</div>
              </div>
              <div className="bg-[#0F0F16] p-3 rounded border border-slate-800">
                <div className="text-slate-400">Records Saved</div>
                <div className="text-emerald-400 font-bold text-sm mt-1">{result.dbSavedCount} / {result.count}</div>
              </div>
              <div className="bg-[#0F0F16] p-3 rounded border border-slate-800">
                <div className="text-slate-400">Near-Duplicates</div>
                <div className={`font-bold text-sm mt-1 ${result.duplicatesDetected > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {result.duplicatesDetected}
                </div>
              </div>
              <div className="bg-[#0F0F16] p-3 rounded border border-slate-800">
                <div className="text-slate-400">Platform Breakdown</div>
                <div className="text-slate-300 mt-1 flex gap-2 flex-wrap">
                  {platformStats && Object.entries(platformStats).map(([platform, cnt]) => (
                    <span key={platform} className="uppercase font-bold text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                      {platform}: {cnt}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400">Sample Dataset Preview (First 3 Blueprints):</div>
              <pre className="w-full max-h-48 overflow-y-auto bg-[#040406] border border-slate-800 rounded p-3 text-[11px] text-slate-300 leading-snug">
                {JSON.stringify(result.blueprints.slice(0, 3), null, 2)}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default GroundingResearchUtility;