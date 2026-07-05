import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans selection:bg-[#7C3AED]/10 selection:text-[#7C3AED] py-16 px-6 lg:px-8">
      {/* Small Header */}
      <header className="max-w-7xl mx-auto w-full mb-16">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-start">
          
          {/* Left Column - Metadata & Contact */}
          <div className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-8">
            <span className="font-mono text-[10px] tracking-widest text-[#7C3AED] uppercase font-semibold">Data Protection</span>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 leading-tight">
              Privacy <br className="hidden lg:inline" />Policy.
            </h1>
            <p className="text-xs text-slate-400 font-light font-mono">
              Last Updated: July 05, 2026
            </p>
            <div className="border-t border-slate-900/10 pt-6 mt-2 hidden lg:flex flex-col gap-3 text-xs text-slate-400 font-light">
              <p className="leading-relaxed">
                We believe your brand’s context is your intellectual property. We do not sell or trade your data.
              </p>
              <p className="leading-relaxed">
                If you have inquiries regarding your digital footprint, write to: <a href="mailto:support@brandtopost.com" className="text-slate-655 hover:text-slate-900 underline transition-colors">support@brandtopost.com</a>
              </p>
            </div>
          </div>

          {/* Right Column - Policy Content */}
          <div className="lg:col-span-7 flex flex-col gap-12 font-light text-slate-600 text-sm leading-relaxed font-sans">
            
            {/* Section 1 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-wider uppercase font-sans">
                1. Context Gathering & Processing Operations
              </h2>
              <div className="flex flex-col gap-3">
                <p>
                  To configure our posting nodes, we map out your brand's digital DNA. Sarah, our Research Agent, retrieves public profiles and documents you upload to map your brand guidelines.
                </p>
                <p>
                  This context is saved securely in your dedicated platform instance and is never exposed to public models.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="border-t border-slate-900/10 pt-8 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-wider uppercase font-sans">
                2. Information Processing by Roster Nodes
              </h2>
              <div className="flex flex-col gap-3">
                <p>
                  Our active copywriters and designers use your brand DNA data only to compile draft posts. Chloe and Julian access your uploaded logo files solely to brand your generated images.
                </p>
                <p>
                  Arthur reads your audio samples to compile voice clones, which are kept locked to your account. None of these parameters are used to train other public foundation models.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-t border-slate-900/10 pt-8 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-wider uppercase font-sans">
                3. Third-Party Integrations & Publish Actions
              </h2>
              <div className="flex flex-col gap-3">
                <p>
                  To publish content automatically, we connect to external platform APIs. We store authentication tokens in an encrypted environment to verify access before sending post files.
                </p>
                <p>
                  We share text draft contents and graphics only with the social networks you link. We do not provide your brand profile context to external marketing lists.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="border-t border-slate-900/10 pt-8 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-wider uppercase font-sans">
                4. Database Retention & Deletion Rights
              </h2>
              <div className="flex flex-col gap-3">
                <p>
                  We store context files and posting logs as long as your subscription is active. If you cancel your membership, you can initiate a complete profile deletion from your settings pane.
                </p>
                <p>
                  Requesting deletion immediately terminates all context databases, eliminating the parameters stored by Sarah and Alex.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="border-t border-slate-900/10 pt-8 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-wider uppercase font-sans">
                5. Cookies & Analytical Logging
              </h2>
              <div className="flex flex-col gap-3">
                <p>
                  We compile browser logs to monitor navigation flow and identify script bugs. These logs track visit durations and click logs, but do not collect text details from draft posts.
                </p>
                <p>
                  You can disable cookie collection in your browser settings without affecting the core performance of the agents.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="border-t border-slate-900/10 pt-8 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-slate-900 tracking-wider uppercase font-sans">
                6. Revisions to this Privacy Policy
              </h2>
              <div className="flex flex-col gap-3">
                <p>
                  We update these privacy rules as we add new capabilities to our agent roster. We notify you of changes by updating the timestamp at the top of this document.
                </p>
                <p>
                  Continued use of our posting nodes confirms your acceptance of any updated privacy parameters.
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Small Footer */}
      <footer className="max-w-7xl mx-auto w-full border-t border-slate-900/10 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <p className="font-light font-mono text-[10px]">
          &copy; {new Date().getFullYear()} BrandToPost Systems. All rights reserved.
        </p>
        <div className="flex gap-6 font-light font-mono text-[10px]">
          <span className="text-slate-600">Privacy Policy</span>
          <span className="text-slate-200">/</span>
          <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
