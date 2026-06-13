// Init logic for floating icons
const iconsData = [
    { name: 'Ps', color: '#001E36', bg: '#31A8FF', x: 200, y: 150, r: 15 },
    { name: 'Ai', color: '#330000', bg: '#FF9A00', x: 1600, y: 200, r: -20 },
    { name: 'Fm', color: '#FFF', bg: '#F24E1E', x: 400, y: 800, r: 10 },
    { name: 'Cv', color: '#FFF', bg: '#00C4CC', x: 1400, y: 750, r: -15 },
    { name: 'Dr', color: '#FFF', bg: '#0F9D58', x: 800, y: 200, r: 5 },
    { name: 'St', color: '#FFF', bg: '#5A67D8', x: 1000, y: 850, r: -5 },
    { name: 'Fb', color: '#FFF', bg: '#1877F2', x: 150, y: 550, r: -25 },
    { name: 'Ig', color: '#FFF', bg: '#E1306C', x: 1700, y: 500, r: 12 }
];
const floatingIconsNode = document.getElementById('floating-icons');
if(floatingIconsNode) {
    iconsData.forEach(ic => {
        let el = document.createElement('div');
        el.className = 'floating-icon';
        el.innerText = ic.name;
        el.style.backgroundColor = ic.bg;
        el.style.color = ic.color;
        el.style.left = ic.x + 'px';
        el.style.top = ic.y + 'px';
        floatingIconsNode.appendChild(el);
    });
}

// Generate Ring items
const ringNode = document.getElementById('integration-ring');
if(ringNode) {
    const numItems = 6;
    const radius = 250;
    const ringIcons = ['Dr', 'Ps', 'Fb', 'Ig', 'St', 'Cv'];
    const ringBg = ['#0F9D58', '#31A8FF', '#1877F2', '#E1306C', '#5A67D8', '#00C4CC'];
    for(let i=0; i<numItems; i++) {
        let angle = (i / numItems) * Math.PI * 2;
        let x = Math.cos(angle) * radius + 200; // Center is 250, item is 100, so +200 is center
        let y = Math.sin(angle) * radius + 200;
        let el = document.createElement('div');
        el.className = 'ring-item';
        el.innerText = ringIcons[i];
        el.style.backgroundColor = ringBg[i];
        el.style.color = '#FFF';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        ringNode.appendChild(el);
    }
}

// GSAP Timeline setup
const tl = gsap.timeline();

// Setup initial scattered state
gsap.set('.scene', { autoAlpha: 0 });
gsap.set('.floating-icon', { scale: 0, rotation: (i) => iconsData[i].r });

// ============================================
// SCENE 1: BE HONEST (0 - 4s)
// ============================================
tl.set('#scene-honest', { autoAlpha: 1 })
  .fromTo('#txt-okay', { scale: 0.5, opacity: 0 }, { duration: 1.2, scale: 1, opacity: 1, ease: 'back.out(1.5)' })
  .to('.floating-icon', { duration: 1.2, scale: 1, stagger: 0.1, ease: 'back.out(2)' }, "-=0.8")
  .to('.floating-icon', { duration: 4, y: '+=40', rotation: '+=15', yoyo: true, repeat: -1, ease: 'sine.inOut' }, "-=0.5")
  .to('#txt-okay', { duration: 0.6, opacity: 0, y: -50, delay: 1 })
  .fromTo('#txt-be-honest', { y: 60, opacity: 0 }, { duration: 0.8, y: 0, opacity: 1, ease: 'power3.out' }, "-=0.2")
  .to('#scene-honest', { duration: 0.6, opacity: 0, delay: 1.5 });

// ============================================
// SCENE 2: THE PROBLEM (4 - 12s)
// ============================================
tl.set('#scene-problem', { autoAlpha: 1 })
  .fromTo('#txt-how-many', { y: 40, opacity: 0 }, { duration: 1, y: 0, opacity: 1, ease: 'power3.out' })
  .to('#txt-how-many', { duration: 0.6, opacity: 0, delay: 2 })
  
  // Flash numbers
  .fromTo('#num-10', { scale: 0.5, opacity: 0 }, { duration: 0.6, scale: 1, opacity: 1, ease: 'back.out(2)' })
  .to('#num-10', { duration: 0.4, scale: 1.5, opacity: 0, delay: 0.8 })
  .fromTo('#num-30', { scale: 0.5, opacity: 0 }, { duration: 0.6, scale: 1, opacity: 1, ease: 'back.out(2)' })
  .to('#num-30', { duration: 0.4, scale: 1.5, opacity: 0, delay: 0.8 })
  .fromTo('#num-50', { scale: 0.5, opacity: 0 }, { duration: 0.6, scale: 1, opacity: 1, ease: 'back.out(2)' })
  .to('#num-50', { duration: 0.6, scale: 1.5, opacity: 0, delay: 1 })
  
  // And how many actually look...
  .fromTo('#txt-how-many-good', { y: 40, opacity: 0 }, { duration: 1, y: 0, opacity: 1 })
  .to('#txt-how-many-good', { duration: 0.6, opacity: 0, delay: 1.5 })
  .fromTo('#txt-good', { scale: 0.5, opacity: 0, rotation: -10 }, { duration: 1.2, scale: 1, opacity: 1, rotation: 0, ease: 'elastic.out(1, 0.4)' })
  .to('#scene-problem', { duration: 0.6, opacity: 0, delay: 2 });

// ============================================
// SCENE 3: STOP (12 - 20s)
// ============================================
tl.set('#scene-stop', { autoAlpha: 1 })
  .fromTo('#txt-not-bc', { x: -60, opacity: 0 }, { duration: 1, x: 0, opacity: 1 })
  .to('#txt-not-bc', { duration: 0.6, opacity: 0, delay: 1.5 })
  .fromTo('#txt-but-bc', { x: 60, opacity: 0 }, { duration: 1, x: 0, opacity: 1 })
  .to('#txt-but-bc', { duration: 0.6, opacity: 0, delay: 1.5 })
  .fromTo('#txt-slipping', { y: 40, opacity: 0 }, { duration: 1.2, y: 0, opacity: 1 })
  .to('#txt-slipping', { duration: 0.6, opacity: 0, delay: 2.5 })
  
  // STOP!
  .to('.bg-grid', { duration: 0.5, opacity: 0 }) 
  .fromTo('#txt-stop', { scale: 4, opacity: 0 }, { duration: 0.6, scale: 1, opacity: 1, ease: 'power4.in' })
  .to('#txt-stop', { duration: 0.3, x: 15, yoyo: true, repeat: 7 }) // Shake
  .to('#scene-stop', { duration: 0.5, opacity: 0, delay: 1 });

// ============================================
// SCENE 4: INTRO (20 - 28s)
// ============================================
tl.set('#scene-intro', { autoAlpha: 1 })
  .fromTo('#b2p-logo-intro', { scale: 0.8, opacity: 0, y: 60 }, { duration: 1.2, scale: 1, opacity: 1, y: 0, ease: 'back.out(1.5)' })
  .fromTo('#txt-agent', { opacity: 0, y: 30 }, { duration: 1, opacity: 1, y: 0 }, "+=0.6")
  .to(['#b2p-logo-intro', '#txt-agent'], { duration: 0.6, opacity: 0, y: -40, delay: 2.5 })
  .fromTo('#txt-runs', { opacity: 0, scale: 0.9 }, { duration: 1.2, opacity: 1, scale: 1 })
  .to('#scene-intro', { duration: 0.6, opacity: 0, delay: 2.5 });

// ============================================
// SCENE 5: INTEGRATIONS (28 - 36s)
// ============================================
tl.set('#scene-integrations', { autoAlpha: 1 })
  .fromTo('#txt-plugged', { opacity: 0, y: -40 }, { duration: 1, opacity: 1, y: 0 })
  .fromTo('.ring', { scale: 0, opacity: 0, rotation: -180 }, { duration: 2, scale: 1, opacity: 1, rotation: 0, ease: 'power3.out' })
  .to('.ring-item', { duration: 10, rotation: 360, transformOrigin: "-150px 100px", repeat: -1, ease: "linear" }, "<") // Rotate items slowly
  .fromTo('#txt-unified', { opacity: 0, y: 40 }, { duration: 1, opacity: 1, y: 0 }, "-=0.5")
  .to('#scene-integrations', { duration: 0.6, opacity: 0, delay: 3 });

// ============================================
// SCENE 6: WORKFLOW (36 - 46s)
// ============================================
tl.set('#scene-workflow', { autoAlpha: 1 })
  .fromTo('#txt-workflow-title', { opacity: 0, scale: 1.1 }, { duration: 1, opacity: 1, scale: 1 })
  .fromTo('#wf-1', { opacity: 0, x: -60 }, { duration: 0.6, opacity: 1, x: 0 })
  .fromTo('#wf-2', { opacity: 0, x: -60 }, { duration: 0.6, opacity: 1, x: 0 }, "+=1")
  .fromTo('#wf-3', { opacity: 0, x: -60 }, { duration: 0.6, opacity: 1, x: 0 }, "+=1")
  .fromTo('#wf-4', { opacity: 0, x: -60 }, { duration: 0.6, opacity: 1, x: 0 }, "+=1")
  .to('#scene-workflow', { duration: 0.6, opacity: 0, delay: 2.5 });

// ============================================
// SCENE 7: FAST WORDS (46 - 50s)
// ============================================
tl.set('#scene-fastwords', { autoAlpha: 1 })
  .set(['#fw-creatives', '#fw-campaigns'], { display: 'none' })
  .fromTo('#fw-products', { opacity: 0, scale: 0.8 }, { duration: 0.3, opacity: 1, scale: 1 })
  .to('#fw-products', { duration: 0.3, opacity: 0, display: 'none', delay: 0.8 })
  .set('#fw-creatives', { display: 'block' })
  .fromTo('#fw-creatives', { opacity: 0, scale: 0.8 }, { duration: 0.3, opacity: 1, scale: 1 })
  .to('#fw-creatives', { duration: 0.3, opacity: 0, display: 'none', delay: 0.8 })
  .set('#fw-campaigns', { display: 'block' })
  .fromTo('#fw-campaigns', { opacity: 0, scale: 0.8 }, { duration: 0.3, opacity: 1, scale: 1 })
  .to('#scene-fastwords', { duration: 0.6, opacity: 0, delay: 0.8 });

// ============================================
// SCENE 8: CONNECTED (50 - 58s)
// ============================================
tl.set('#scene-connected', { autoAlpha: 1 })
  .fromTo('#mock-1', { opacity: 0, y: 150 }, { duration: 1.2, opacity: 1, y: 0, ease: 'power3.out' })
  .fromTo('#mock-2', { opacity: 0, x: -150, rotation: -15 }, { duration: 1, opacity: 1, x: 0, rotation: -5, ease: 'back.out(1.2)' }, "-=0.8")
  .fromTo('#mock-3', { opacity: 0, x: 150, rotation: 15 }, { duration: 1, opacity: 1, x: 0, rotation: 5, ease: 'back.out(1.2)' }, "-=0.8")
  .fromTo('#txt-connected', { opacity: 0, y: 40 }, { duration: 1, opacity: 1, y: 0 })
  .to('#scene-connected', { duration: 0.6, opacity: 0, delay: 3 });

// ============================================
// SCENE 9: OUTRO (58 - 65s)
// ============================================
tl.set('#scene-outro', { autoAlpha: 1 })
  .to('.bg-grid', { duration: 1, opacity: 1 }) 
  .fromTo('#txt-finally', { opacity: 0, y: 30 }, { duration: 1.2, opacity: 1, y: 0 })
  .to('#txt-finally', { duration: 0.6, opacity: 0, delay: 2 })
  .fromTo('#b2p-logo-outro', { scale: 0.5, opacity: 0 }, { duration: 1.2, scale: 1, opacity: 1, ease: 'elastic.out(1, 0.5)' })
  .fromTo('#cta-btn', { y: 60, opacity: 0 }, { duration: 1, y: 0, opacity: 1, ease: 'power3.out' }, "-=0.6");

// Pulse CTA button
tl.to('#cta-btn', { duration: 2, scale: 1.05, boxShadow: '0 20px 60px rgba(124,58,237,0.6)', yoyo: true, repeat: -1 });
