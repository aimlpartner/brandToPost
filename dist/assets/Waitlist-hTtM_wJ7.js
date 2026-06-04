import{b as h,r as i,j as e}from"./index-rhV4gJeJ.js";import{A as S}from"./arrow-right-CNxm5oSY.js";import{M as k}from"./mail-DXOe-Cne.js";import{I}from"./instagram-nhLpzgYq.js";const E=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],z=h("check",E);const T=[["path",{d:"M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",key:"pff0z6"}]],O=h("twitter",T),_="https://script.google.com/macros/s/AKfycbzmMybk6WP283pvxNDwv1Bgfb_au5VQxoRrQwZZbh6Kf_rsPZBiQx2rVMSSV650lXPHiw/exec";function C(){const[m]=i.useState(()=>{let t=localStorage.getItem("b2p_visitor_id");return t||(t="user_"+Math.random().toString(36).substring(2,10),localStorage.setItem("b2p_visitor_id",t)),t}),[p,g]=i.useState("DESKTOP"),[l,b]=i.useState(()=>{const t=localStorage.getItem("b2p_location");return t?JSON.parse(t):null}),[c,w]=i.useState(""),[y,x]=i.useState("capture"),[d,f]=i.useState(!1),[v,j]=i.useState("");i.useEffect(()=>{const t=()=>{const s=window.matchMedia("(max-width: 768px)").matches||/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);g(s?"MOBILE":"DESKTOP")};return t(),window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[]),i.useEffect(()=>{const t=()=>{const n=new Date,a={year:"numeric",month:"short",day:"2-digit"},r=n.toLocaleDateString("en-US",a).toUpperCase(),o=n.toTimeString().split(" ")[0];j(`${r}, ${o}`)};t();const s=setInterval(t,1e3);return()=>clearInterval(s)},[]);const u=i.useCallback((t,s="No Email",n={},a=null)=>{try{const r=a||l||JSON.parse(localStorage.getItem("b2p_location"))||"Unknown",o=new FormData;o.append("email",s),o.append("interactions",JSON.stringify({userId:m,device:p,location:r,event:t,data:n,timestamp:new Date().toISOString()})),fetch(_,{method:"POST",mode:"no-cors",body:o})}catch(r){console.error("Tracking Error:",r)}},[m,p,l]);i.useEffect(()=>{(async()=>{let s=l;if(!s)try{let n=await fetch("https://ipapi.co/json/"),a=await n.json();a&&a.city?s={city:a.city,region:a.region,country:a.country_name}:(n=await fetch("https://ipwho.is/"),a=await n.json(),a&&a.city&&(s={city:a.city,region:a.region,country:a.country})),s&&(b(s),localStorage.setItem("b2p_location",JSON.stringify(s)))}catch{console.log("Location tracking resolved silently.")}sessionStorage.getItem("b2p_visit_tracked")||(u("page_visit","No Email",{},s),sessionStorage.setItem("b2p_visit_tracked","true"))})()},[]);const N=async t=>{if(t.preventDefault(),!!c){f(!0),u("waitlist_email_captured",c);try{await new Promise(s=>setTimeout(s,800)),x("completed")}catch{x("completed")}finally{f(!1)}}};return e.jsxs("div",{className:"min-h-screen flex flex-col bg-[#050508] text-zinc-300 font-sans selection:bg-[#7C3AED] selection:text-white relative overflow-hidden select-none",children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=Outfit:wght@100;200;300;400;500&display=swap');
        
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Outfit', sans-serif; }

        /* Premium cinematic dark vignette overlay */
        .vignette-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle, transparent 20%, rgba(5, 5, 8, 0.75) 70%, rgba(5, 5, 8, 0.98) 100%);
          z-index: 2;
          pointer-events: none;
        }

        /* Subtle cinematic ambient noise */
        .ambient-grain {
          position: fixed;
          inset: 0;
          background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
          opacity: 0.02;
          z-index: 1;
          pointer-events: none;
        }

        /* Input interaction glow */
        .brutalist-input:focus {
          border-color: #ffffff !important;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.08);
        }

        /* High-tension cinematic background video layout */
        .brand-mascot-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 90%;
          max-width: 800px;
          height: 100%;
          object-fit: cover;
          object-position: right top;
          opacity: 0.35;
          z-index: 0;
          pointer-events: none;
          filter: grayscale(0.15) contrast(1.2) brightness(0.38) sepia(0.05);
          mix-blend-mode: screen;
        }

        @media (max-width: 768px) {
          .brand-mascot-bg {
            width: 100%;
            opacity: 0.25;
            object-position: 70% center;
          }
        }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}),e.jsx("div",{className:"vignette-overlay"}),e.jsx("div",{className:"ambient-grain"}),e.jsx("div",{className:"absolute top-[-10%] left-1/4 w-[700px] h-[500px] bg-[#7C3AED]/8 rounded-full blur-[140px] pointer-events-none z-0"}),e.jsx("div",{className:"absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-[#18F07A]/3 rounded-full blur-[120px] pointer-events-none z-0"}),e.jsx("video",{autoPlay:!0,loop:!0,muted:!0,playsInline:!0,className:"brand-mascot-bg",poster:"https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/Mask-group.png",src:"https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/05/VID-20260420-WA0001.mp4"}),e.jsxs("div",{className:"relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-12",children:[e.jsxs("header",{className:"w-full max-w-7xl mx-auto flex justify-between items-center",children:[e.jsxs("div",{className:"flex items-center text-white font-display font-medium text-xs tracking-[0.3em] uppercase italic gap-2.5",children:[e.jsx("img",{src:"https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png",alt:"BrandToPost Logo",className:"w-5 h-5 object-contain"}),e.jsxs("span",{children:["BRANDTOPOST ",e.jsx("span",{className:"text-zinc-600",children:"//"})," DISPATCH"]})]}),e.jsxs("div",{className:"text-[9px] font-sans font-medium px-3 py-1 border border-zinc-800 bg-black/40 text-zinc-500 rounded flex items-center gap-2 uppercase tracking-widest",children:[e.jsx("span",{className:"w-1 h-1 rounded-full bg-[#18F07A] animate-pulse"}),"PILOT NODE"]})]}),e.jsx("main",{className:"w-full max-w-7xl mx-auto flex flex-col justify-end items-start h-full pb-16 pt-24",children:e.jsx("div",{className:"w-full max-w-lg flex flex-col gap-8",children:y==="capture"?e.jsxs("div",{className:"fade-in flex flex-col gap-6",children:[e.jsx("div",{className:"flex flex-col gap-3",children:e.jsxs("h1",{className:"text-2xl sm:text-3xl md:text-4xl font-display font-medium text-white tracking-[-0.02em] leading-[1.15] uppercase",children:["THE AGE OF BUSINESS CONTEXT",e.jsx("br",{}),"IS COMING."]})}),e.jsxs("form",{onSubmit:N,className:"flex flex-col gap-3 w-full font-sans",children:[e.jsx("input",{type:"email",required:!0,value:c,onChange:t=>w(t.target.value),placeholder:"EMAIL ADDRESS",className:"brutalist-input w-full bg-black/60 backdrop-blur-md border border-zinc-800 px-5 py-4 text-white placeholder-zinc-700 focus:outline-none transition-all duration-150 uppercase text-xs tracking-wider font-light",disabled:d}),e.jsxs("button",{type:"submit",disabled:d,className:"w-full bg-transparent hover:bg-white hover:text-black text-white font-medium text-xs tracking-[0.25em] py-4 transition-all uppercase flex items-center justify-center gap-2 active:scale-[0.99] border border-zinc-800 hover:border-white",children:[d?"SECURING...":"JOIN WAITLIST"," ",e.jsx(S,{className:"w-4 h-4"})]})]}),e.jsxs("div",{className:"text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-sans font-medium flex items-center gap-2",children:[e.jsx("span",{children:"INITIAL NODES: 50 BRANDS"}),e.jsx("span",{className:"text-zinc-800",children:"//"}),e.jsx("span",{className:"text-[#18F07A] animate-pulse",children:"14 SPOTS LEFT"})]})]}):e.jsxs("div",{className:"fade-in flex flex-col gap-4 text-left",children:[e.jsx("div",{className:"w-10 h-10 border border-[#18F07A]/40 bg-[#18F07A]/5 flex items-center justify-center text-[#18F07A] mb-2",children:e.jsx(z,{className:"w-4 h-4"})}),e.jsx("h2",{className:"text-2xl font-display font-medium text-white uppercase tracking-[-0.02em]",children:"DISPATCH SECURED."}),e.jsxs("p",{className:"text-zinc-500 text-xs leading-relaxed font-sans font-light",children:["Your position has been recorded. Your unique pilot access ticket will be dispatched immediately to ",e.jsx("span",{className:"text-white underline",children:c}),"."]})]})})}),e.jsxs("footer",{className:"w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-zinc-900/60 font-sans font-medium",children:[e.jsxs("div",{className:"text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-2",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse"}),e.jsx("span",{children:v||"MAY 24 2026, 14:43:00"})]}),e.jsxs("div",{className:"flex gap-6",children:[e.jsx("a",{href:"mailto:team@brandtopost.com",className:"text-zinc-600 hover:text-white transition-colors",children:e.jsx(k,{className:"w-4 h-4"})}),e.jsx("a",{href:"https://x.com",target:"_blank",rel:"noreferrer",className:"text-zinc-600 hover:text-white transition-colors",children:e.jsx(O,{className:"w-4 h-4"})}),e.jsx("a",{href:"https://instagram.com",target:"_blank",rel:"noreferrer",className:"text-zinc-600 hover:text-white transition-colors",children:e.jsx(I,{className:"w-4 h-4"})})]})]})]})]})}export{C as default};
