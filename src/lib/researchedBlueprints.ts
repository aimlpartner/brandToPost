import { CANVA_TEMPLATE_BLUEPRINTS } from './canvaBlueprints';
import type { ResearchedBlueprint } from '../components/BlueprintVisualRenderer';
export type { ResearchedBlueprint };

export const DEFAULT_BLUEPRINTS: ResearchedBlueprint[] = CANVA_TEMPLATE_BLUEPRINTS as ResearchedBlueprint[];

export let RESEARCHED_BLUEPRINTS: ResearchedBlueprint[] = [...DEFAULT_BLUEPRINTS];

export async function fetchResearchedBlueprints(): Promise<ResearchedBlueprint[]> {
  try {
    const res = await fetch('/api/research-blueprints');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.blueprints) && data.blueprints.length > 0) {
        // Merge Canva templates with live researched blueprints
        const merged = [...DEFAULT_BLUEPRINTS, ...data.blueprints];
        // Deduplicate by blueprint_id
        const uniqueMap = new Map();
        merged.forEach(item => uniqueMap.set(item.blueprint_id, item));
        RESEARCHED_BLUEPRINTS = Array.from(uniqueMap.values());
        return RESEARCHED_BLUEPRINTS;
      }
    }
  } catch (e) {
    console.warn('[researchedBlueprints] Failed to fetch live blueprints, using Canva templates.', e);
  }
  return DEFAULT_BLUEPRINTS;
}

export function getBlueprintsByPlatform(blueprints: ResearchedBlueprint[], platform: string): ResearchedBlueprint[] {
  if (!platform || platform === 'all') return blueprints;
  return blueprints.filter((bp) => bp.platform?.toLowerCase() === platform.toLowerCase());
}

export function getBlueprintById(blueprints: ResearchedBlueprint[], id: string): ResearchedBlueprint | undefined {
  return blueprints.find((bp) => bp.blueprint_id === id);
}
