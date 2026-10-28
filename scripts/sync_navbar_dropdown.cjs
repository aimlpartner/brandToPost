const fs = require('fs');
const path = require('path');

const navHtml = `  <!-- ==========================================
       NAVIGATION (Zero Pills, Pure Editorial Bar)
       ========================================== -->
  <nav id="main-nav" class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#08080C]/85 border-b border-white/[0.08] py-4 backdrop-blur-xl text-white">
    <div class="max-w-7xl mx-auto px-6 lg:px-10 relative">
      <div class="flex justify-between items-center">
        <!-- Brand Logo -->
        <a class="flex items-center gap-3 group shrink-0" href="#">
          <div class="w-7 h-7 bg-[#7C3AED] flex items-center justify-center text-white font-serif font-semibold text-base group-hover:bg-[#6D28D9] transition-colors">
            B
          </div>
          <span class="text-base tracking-tight font-semibold">BrandToPost</span>
        </a>

        <!-- Clean Text Links + Integrations Hamburger Trigger -->
        <div class="flex items-center gap-4 sm:gap-6 lg:gap-8">
          <!-- Integrations Hamburger Dropdown Trigger -->
          <button
            id="integrations-btn"
            onclick="toggleIntegrationsMenu(event)"
            class="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all text-xs font-medium cursor-pointer"
            aria-expanded="false"
            aria-label="Toggle integrations dropdown"
          >
            <!-- Hamburger 3-line animated icon -->
            <div class="w-4 h-3 flex flex-col justify-between items-center relative pointer-events-none">
              <span id="burger-line-1" class="block h-[1.5px] w-full bg-current transition-transform duration-300"></span>
              <span id="burger-line-2" class="block h-[1.5px] w-full bg-current transition-opacity duration-200"></span>
              <span id="burger-line-3" class="block h-[1.5px] w-full bg-current transition-transform duration-300"></span>
            </div>
            <span class="tracking-tight font-medium pointer-events-none">Integrations</span>
            <svg id="burger-chevron" class="w-3.5 h-3.5 transition-transform duration-300 text-white/60 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <a class="hidden sm:inline-block text-xs font-medium opacity-70 hover:opacity-100 transition-opacity" href="/agency">Agency OS</a>
          <a class="hidden sm:inline-block text-xs font-medium opacity-70 hover:opacity-100 transition-opacity" href="/founder">Founder Studio</a>
          <a class="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity" href="/blog">Blog</a>
          <a class="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity hidden md:block" href="/login">Sign In</a>
          <a class="px-4 py-2 text-xs font-medium tracking-wide transition-all bg-[#7C3AED] hover:bg-[#6D28D9] text-white whitespace-nowrap" href="/login?mode=signup">
            Start free trial
          </a>
        </div>
      </div>

      <!-- Hamburger Integrations Mega Dropdown Panel -->
      <div
        id="integrations-menu"
        class="hidden absolute top-full left-4 right-4 sm:left-auto sm:right-6 lg:right-10 mt-3 sm:w-[720px] md:w-[840px] lg:w-[940px] max-h-[82vh] overflow-y-auto bg-[#0A0A0F]/95 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-2xl rounded-2xl p-6 sm:p-7 z-50 text-left"
      >
        <!-- Dropdown Header -->
        <div class="flex items-center justify-between pb-5 border-b border-white/10">
          <div class="space-y-1">
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <h3 class="text-sm font-semibold text-white tracking-tight">Direct Network Integrations</h3>
              <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                11 Native Connectors
              </span>
            </div>
            <p class="text-xs text-white/50">
              Direct API sync with zero third-party zaps required. Schedule, format, and push live with 1 tap.
            </p>
          </div>
          <button
            onclick="closeIntegrationsMenu()"
            class="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close integrations menu"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Integrations Grid by Category (11 Channels) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-5">
          <!-- Col 1: Social & Professional Feeds -->
          <div class="space-y-3">
            <div class="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 font-semibold px-1">
              Social & Professional Feeds
            </div>
            <div class="space-y-2">
              <!-- LinkedIn -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#0A66C2]/15 border border-[#0A66C2]/30">
                  <img src="/native-marketing-on-autopilot.svg.svg-100.Woblo.svg" alt="LinkedIn" class="w-5 h-5 object-contain rounded-sm" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">LinkedIn</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Company & Personal</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Multi-slide PDF carousels, text thought-leadership & founder takes</p>
                </div>
              </div>

              <!-- X (Twitter) -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-white/10 border border-white/20 text-white">
                  <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">X (Twitter)</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Viral Threads & Posts</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">High-hook viral threads, commentary & direct founder insights</p>
                </div>
              </div>

              <!-- Instagram -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#E1306C]/15 border border-[#E1306C]/30 text-[#E1306C]">
                  <svg class="w-4.5 h-4.5 text-[#E1306C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">Instagram</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">4:5 Visuals & Reels</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Layered 4:5 carousels, editorial branding & Reels video scripts</p>
                </div>
              </div>

              <!-- Facebook -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#1877F2]/15 border border-[#1877F2]/30">
                  <img src="/native-marketing-on-autopilot.svg.svg-647.Woblo.svg" alt="Facebook" class="w-5 h-5 object-contain rounded-full" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">Facebook</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Pages & Groups</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Scheduled business announcements, case studies & discussion posts</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 2: Video & Search Discovery -->
          <div class="space-y-3">
            <div class="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 font-semibold px-1">
              Video & Search Discovery
            </div>
            <div class="space-y-2">
              <!-- TikTok -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#00F2FE]/15 border border-[#00F2FE]/30 text-[#00F2FE]">
                  <svg class="w-4 h-4 fill-[#00F2FE]" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.59 6.33 6.33 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.33V9.22a8.16 8.16 0 0 0 4.67 1.48V7.27a4.84 4.84 0 0 1-.75-.58z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">TikTok</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">9:16 Video Scripts</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Hook-first vertical video scripts, audio pacing & prompt directives</p>
                </div>
              </div>

              <!-- YouTube -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#FF0000]/15 border border-[#FF0000]/30 text-[#FF0000]">
                  <svg class="w-4 h-4 fill-[#FF0000]" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">YouTube</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Shorts & Community</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Full video storyboards, description SEO & community tab posts</p>
                </div>
              </div>

              <!-- Pinterest -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#E60023]/15 border border-[#E60023]/30">
                  <img src="/native-marketing-on-autopilot.svg.svg-1022.Woblo.svg" alt="Pinterest" class="w-4.5 h-4.5 object-contain" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">Pinterest</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Visual Search Pins</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Infographic pins, visual authority assets & automated board routing</p>
                </div>
              </div>

              <!-- Threads -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-white/10 border border-white/20 text-white">
                  <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12.001 2c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10 5.522 0 10-4.478 10-10 0-5.523-4.478-10-10-10zm4.57 13.916c-.516.897-1.321 1.572-2.327 1.954-1.006.381-2.115.421-3.208.115-1.092-.307-2.03-.974-2.712-1.928-.683-.955-1.05-2.114-1.06-3.307.01-1.194.377-2.353 1.06-3.308.682-.954 1.62-1.621 2.712-1.928 1.093-.306 2.202-.266 3.208.115 1.006.382 1.811 1.057 2.327 1.954.148.258.06.587-.198.736-.258.148-.588.06-.736-.198-.415-.721-1.062-1.264-1.87-1.57-1.189-.452-2.527-.294-3.578.423-1.05.717-1.688 1.905-1.706 3.176.018 1.27.656 2.458 1.706 3.175 1.051.717 2.389.875 3.578.423.808-.306 1.455-.849 1.87-1.57.148-.258.478-.346.736-.198.258.149.346.478.198.736z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">Threads</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Meta Text Feeds</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Micro-blogging, rapid market observations & conversational replies</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 3: Operations & Syndication -->
          <div class="space-y-3">
            <div class="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 font-semibold px-1">
              Operations & Syndication
            </div>
            <div class="space-y-2">
              <!-- WhatsApp Bot -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#25D366]/15 border border-[#25D366]/30">
                  <img src="/okara-the-only-ai-cmo-that-puts-marketing-on-autopilot.svg.svg-55.Woblo.svg" alt="WhatsApp" class="w-4.5 h-4.5 object-contain" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">WhatsApp Bot</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Voice & 1-Tap</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">20s voice notes turned into posts; reply '1' to publish live instantly</p>
                </div>
              </div>

              <!-- Reddit -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#FF4500]/15 border border-[#FF4500]/30 text-[#FF4500]">
                  <svg class="w-4 h-4 fill-[#FF4500]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M16.5 13c0-.8-.6-1.5-1.5-1.5-.4 0-.8.2-1 .5-1-.7-2.4-1.1-3.9-1.1l.8-3.5 2.5.5c.1.6.6 1.1 1.3 1.1.7 0 1.3-.6 1.3-1.3S15.4 6.4 14.7 6.4c-.5 0-1 .3-1.2.8l-2.8-.6c-.2 0-.4.1-.5.3l-.9 4c-1.5.1-2.9.5-3.9 1.1-.3-.3-.6-.5-1-.5-.8 0-1.5.7-1.5 1.5 0 .6.4 1.1.9 1.4 0 .2 0 .4 0 .6 0 2.2 2.6 4 5.8 4s5.8-1.8 5.8-4c0-.2 0-.4 0-.6.6-.3 1.1-.8 1.1-1.4z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">Reddit</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">Niche Communities</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Zero-spam authentic value drops strictly tailored to subreddit rules</p>
                </div>
              </div>

              <!-- Blog & Webhooks -->
              <div class="group flex items-start gap-3 p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-semibold text-white group-hover:text-[#A78BFA] transition-colors">Blog & Webhooks</span>
                    <span class="text-[9px] font-mono text-white/40 truncate">SEO Articles & API</span>
                  </div>
                  <p class="text-[11px] text-white/50 line-clamp-2 leading-relaxed mt-0.5">Long-form markdown blog articles, Ghost/WordPress feeds & webhooks</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dropdown Footer CTA -->
        <div class="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 text-white/60">
            <span class="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"></span>
            <span>Need custom enterprise CRM, Slack, or CMS webhooks?</span>
          </div>
          <a
            href="/login?mode=signup"
            onclick="closeIntegrationsMenu()"
            class="inline-flex items-center gap-1.5 font-medium text-[#A78BFA] hover:text-white transition-colors group/cta"
          >
            <span>Connect all 11 platforms free</span>
            <svg class="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </div>
  </nav>`;

const navScript = `
    // Integrations Hamburger Dropdown Control
    function toggleIntegrationsMenu(event) {
      if (event) event.stopPropagation();
      const menu = document.getElementById('integrations-menu');
      const btn = document.getElementById('integrations-btn');
      const line1 = document.getElementById('burger-line-1');
      const line2 = document.getElementById('burger-line-2');
      const line3 = document.getElementById('burger-line-3');
      const chevron = document.getElementById('burger-chevron');
      if (!menu) return;
      
      const isOpen = !menu.classList.contains('hidden');
      if (isOpen) {
        closeIntegrationsMenu();
      } else {
        menu.classList.remove('hidden');
        if (btn) {
          btn.classList.add('bg-white/10', 'border-white/30', 'text-white', 'shadow-[0_0_15px_rgba(124,58,237,0.25)]');
          btn.classList.remove('bg-white/[0.04]', 'border-white/10', 'text-white/80');
          btn.setAttribute('aria-expanded', 'true');
        }
        if (line1) line1.classList.add('rotate-45', 'translate-y-[5.25px]');
        if (line2) line2.classList.add('opacity-0');
        if (line3) line3.classList.add('-rotate-45', '-translate-y-[5.25px]');
        if (chevron) chevron.classList.add('rotate-180', 'text-white');
      }
    }

    function closeIntegrationsMenu() {
      const menu = document.getElementById('integrations-menu');
      const btn = document.getElementById('integrations-btn');
      const line1 = document.getElementById('burger-line-1');
      const line2 = document.getElementById('burger-line-2');
      const line3 = document.getElementById('burger-line-3');
      const chevron = document.getElementById('burger-chevron');
      if (!menu) return;

      menu.classList.add('hidden');
      if (btn) {
        btn.classList.remove('bg-white/10', 'border-white/30', 'text-white', 'shadow-[0_0_15px_rgba(124,58,237,0.25)]');
        btn.classList.add('bg-white/[0.04]', 'border-white/10', 'text-white/80');
        btn.setAttribute('aria-expanded', 'false');
      }
      if (line1) line1.classList.remove('rotate-45', 'translate-y-[5.25px]');
      if (line2) line2.classList.remove('opacity-0');
      if (line3) line3.classList.remove('-rotate-45', '-translate-y-[5.25px]');
      if (chevron) chevron.classList.remove('rotate-180', 'text-white');
    }

    document.addEventListener('click', function(event) {
      const menu = document.getElementById('integrations-menu');
      const btn = document.getElementById('integrations-btn');
      if (!menu || menu.classList.contains('hidden')) return;
      if (!menu.contains(event.target) && !btn.contains(event.target)) {
        closeIntegrationsMenu();
      }
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeIntegrationsMenu();
      }
    });
`;

const files = [
  path.join(__dirname, '..', 'landing_export', 'index.html'),
  path.join(__dirname, '..', 'landing_page.html')
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Skipping missing file:', file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Replace <nav id="main-nav" ... </nav>
  const navRegex = /<!--\s*={5,}\s*NAVIGATION[\s\S]*?<\/nav>/;
  if (navRegex.test(content)) {
    content = content.replace(navRegex, navHtml);
  } else {
    const rawNavRegex = /<nav id="main-nav"[\s\S]*?<\/nav>/;
    if (rawNavRegex.test(content)) {
      content = content.replace(rawNavRegex, navHtml);
    } else {
      console.error('Could not find nav in', file);
    }
  }

  // Add script before </script>
  if (!content.includes('toggleIntegrationsMenu')) {
    content = content.replace('</script>', `${navScript}\n  </script>`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated:', file);
}
