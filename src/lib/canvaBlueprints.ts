import { ResearchedBlueprint } from '../components/BlueprintVisualRenderer';

export interface CanvaTemplateBlueprint extends ResearchedBlueprint {
  category: 'linkedin' | 'instagram' | 'x' | 'reddit';
  template_name: string;
  canva_archetype: string;
  thumbnail_preview_style: string;
}

export const CANVA_TEMPLATE_BLUEPRINTS: CanvaTemplateBlueprint[] = [
  // ---------------------------------------------------------------------------
  // LINKEDIN CANVA TEMPLATES
  // ---------------------------------------------------------------------------
  {
    blueprint_id: "canva_linkedin_001",
    platform: "linkedin",
    category: "linkedin",
    template_name: "B2B Carousel Cover Spotlight",
    canva_archetype: "carousel_cover",
    thumbnail_preview_style: "Dark minimal header with slide number pill",
    content_intent: "carousel_title",
    ideal_text_length: "short",
    composition_archetype: "carousel_cover",
    grid_layout_axis: "flex; flex-direction: column; justify-content: space-between; padding: 60px;",
    negative_space_description: "40% top padding, centered vertical weight, slide counter badge top-right.",
    typography_rules: {
      heading_font_size: "42px",
      heading_line_height: "1.15",
      heading_font_weight: "800"
    },
    cultural_justification: "High-performing Canva LinkedIn carousel covers use clear slide counts (01 / 07) and bold headline hooks."
  },
  {
    blueprint_id: "canva_linkedin_002",
    platform: "linkedin",
    category: "linkedin",
    template_name: "Editorial Split Infographic Pane",
    canva_archetype: "split_infographic",
    thumbnail_preview_style: "50/50 vertical split with image on right",
    content_intent: "data_heavy",
    ideal_text_length: "medium",
    composition_archetype: "split_pane",
    grid_layout_axis: "grid; grid-template-columns: 1fr 1fr; height: 100%;",
    negative_space_description: "50/50 split pane with 48px padding on text panel.",
    typography_rules: {
      heading_font_size: "32px",
      heading_line_height: "1.25",
      heading_font_weight: "700"
    },
    cultural_justification: "Canva split infographics pair data charts with structured bullet callouts for B2B mobile feeds."
  },
  {
    blueprint_id: "canva_linkedin_003",
    platform: "linkedin",
    category: "linkedin",
    template_name: "Executive Leadership Quote Card",
    canva_archetype: "exec_quote",
    thumbnail_preview_style: "Large quote mark watermark with avatar pill",
    content_intent: "exec_quote",
    ideal_text_length: "short",
    composition_archetype: "quote_card",
    grid_layout_axis: "flex; flex-direction: column; justify-content: space-between; padding: 56px;",
    negative_space_description: "Massive 20% margin around quote text with watermark quotation background.",
    typography_rules: {
      heading_font_size: "30px",
      heading_line_height: "1.35",
      heading_font_weight: "600"
    },
    cultural_justification: "Executive quote cards on LinkedIn build founder authority by isolating key statements."
  },
  {
    blueprint_id: "canva_linkedin_004",
    platform: "linkedin",
    category: "linkedin",
    template_name: "Data Metric Highlight Box",
    canva_archetype: "stat_callout",
    thumbnail_preview_style: "Big stat number pill with caption container",
    content_intent: "data_heavy",
    ideal_text_length: "short",
    composition_archetype: "hero_stat",
    grid_layout_axis: "flex; flex-direction: column; justify-content: center; gap: 24px; padding: 50px;",
    negative_space_description: "Centered metric box with high contrast background accent.",
    typography_rules: {
      heading_font_size: "36px",
      heading_line_height: "1.2",
      heading_font_weight: "900"
    },
    cultural_justification: "Metric highlight frames draw immediate attention on LinkedIn corporate company pages."
  },

  // ---------------------------------------------------------------------------
  // INSTAGRAM CANVA TEMPLATES
  // ---------------------------------------------------------------------------
  {
    blueprint_id: "canva_insta_001",
    platform: "instagram",
    category: "instagram",
    template_name: "Minimalist Micro-Copy Frame",
    canva_archetype: "microcopy_card",
    thumbnail_preview_style: "Clean 1:1 box with pill tag and edge line",
    content_intent: "educational",
    ideal_text_length: "short",
    composition_archetype: "microcopy_card",
    grid_layout_axis: "flex; flex-direction: column; justify-content: space-between; padding: 48px;",
    negative_space_description: "50% negative space around short 15-20 word text block.",
    typography_rules: {
      heading_font_size: "34px",
      heading_line_height: "1.2",
      heading_font_weight: "800"
    },
    cultural_justification: "Canva Instagram micro-copy templates perform best when text is kept under 20 words per slide."
  },
  {
    blueprint_id: "canva_insta_002",
    platform: "instagram",
    category: "instagram",
    template_name: "Editorial Gradient Overlay",
    canva_archetype: "editorial_hero",
    thumbnail_preview_style: "Full photo with bottom gradient text overlay",
    content_intent: "brand_story",
    ideal_text_length: "medium",
    composition_archetype: "editorial_hero",
    grid_layout_axis: "position: relative; flex-direction: column; justify-content: flex-end; padding: 52px;",
    negative_space_description: "Full height image backdrop with bottom 35% dark overlay area.",
    typography_rules: {
      heading_font_size: "38px",
      heading_line_height: "1.15",
      heading_font_weight: "800"
    },
    cultural_justification: "High-end lifestyle and SaaS brands on Instagram rely on cinematic visual overlays for high engagement."
  },
  {
    blueprint_id: "canva_insta_003",
    platform: "instagram",
    category: "instagram",
    template_name: "Before vs After Dual Split",
    canva_archetype: "comparison_split",
    thumbnail_preview_style: "Dual color split pane with VS badge",
    content_intent: "product_teardown",
    ideal_text_length: "medium",
    composition_archetype: "comparison_split",
    grid_layout_axis: "grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 24px;",
    negative_space_description: "Split canvas with 12px gap separator and contrasting brand colors.",
    typography_rules: {
      heading_font_size: "26px",
      heading_line_height: "1.3",
      heading_font_weight: "700"
    },
    cultural_justification: "Comparison grids trigger immediate curiosity on Instagram feeds by showing transformation."
  },

  // ---------------------------------------------------------------------------
  // X (TWITTER) CANVA TEMPLATES
  // ---------------------------------------------------------------------------
  {
    blueprint_id: "canva_x_001",
    platform: "x",
    category: "x",
    template_name: "Single-Stat Hero Callout",
    canva_archetype: "hero_stat",
    thumbnail_preview_style: "Massive centered percentage metric box",
    content_intent: "stat_callout",
    ideal_text_length: "short",
    composition_archetype: "hero_stat",
    grid_layout_axis: "flex; flex-direction: column; justify-content: center; items-align: center; text-align: center;",
    negative_space_description: "Symmetrical padding spotlighting massive metric digits.",
    typography_rules: {
      heading_font_size: "40px",
      heading_line_height: "1.1",
      heading_font_weight: "900"
    },
    cultural_justification: "X posts with massive stat callouts get high retweets and bookmarks from tech founders."
  },
  {
    blueprint_id: "canva_x_002",
    platform: "x",
    category: "x",
    template_name: "Native Tweet Card Wrapper",
    canva_archetype: "tweet_card",
    thumbnail_preview_style: "Clean tweet box with handle, verified check, text",
    content_intent: "quote_card",
    ideal_text_length: "medium",
    composition_archetype: "tweet_card",
    grid_layout_axis: "flex; flex-direction: column; padding: 36px; background: #ffffff; border-radius: 16px;",
    negative_space_description: "Rounded inner container mimicking standard X desktop dark/light mode.",
    typography_rules: {
      heading_font_size: "22px",
      heading_line_height: "1.4",
      heading_font_weight: "500"
    },
    cultural_justification: "Framing content as a native tweet screenshot creates social proof and familiar readability."
  },

  // ---------------------------------------------------------------------------
  // REDDIT CANVA TEMPLATES
  // ---------------------------------------------------------------------------
  {
    blueprint_id: "canva_reddit_001",
    platform: "reddit",
    category: "reddit",
    template_name: "Subreddit-Native Conversational Card",
    canva_archetype: "reddit_post",
    thumbnail_preview_style: "Subreddit header tag with system font text box",
    content_intent: "community_discussion",
    ideal_text_length: "medium",
    composition_archetype: "reddit_post",
    grid_layout_axis: "flex; flex-direction: column; gap: 16px; padding: 40px; background: #0e1113;",
    negative_space_description: "Dark Reddit UI wrapper with top community badge and upvote pill.",
    typography_rules: {
      heading_font_size: "20px",
      heading_line_height: "1.45",
      heading_font_weight: "600"
    },
    cultural_justification: "Reddit communities reject promotional visual polish; native-looking conversational cards bypass ad filters."
  },
  {
    blueprint_id: "canva_reddit_002",
    platform: "reddit",
    category: "reddit",
    template_name: "Annotated Browser Teardown Frame",
    canva_archetype: "annotated_browser",
    thumbnail_preview_style: "Browser window dots with UI screenshot container",
    content_intent: "product_teardown",
    ideal_text_length: "long",
    composition_archetype: "annotated_browser",
    grid_layout_axis: "flex; flex-direction: column; padding: 24px; border-radius: 12px; background: #1a1a1b;",
    negative_space_description: "Browser frame top bar with red/yellow/green control dots.",
    typography_rules: {
      heading_font_size: "18px",
      heading_line_height: "1.35",
      heading_font_weight: "700"
    },
    cultural_justification: "Technical teardowns framed in browser windows prove product authenticity to developers on Reddit."
  }
];
