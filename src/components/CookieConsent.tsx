/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getCookie, setCookie } from "../lib/cookies";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    const consent = getCookie("cookie_consent");
    if (!consent) {
      // Show banner after a slight delay to allow layout animations to load first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Save consent for 365 days
    setCookie("cookie_consent", "accepted", 365);
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Save rejection for 30 days so we don't annoy them constantly
    setCookie("cookie_consent", "rejected", 30);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#08080C] text-white border-t border-white/10 px-6 py-5 shadow-2xl font-sans"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 max-w-3xl">
              <h4 className="text-base font-semibold font-display tracking-tight text-white mb-1.5" style={{ color: '#ffffff' }}>
                We respect your workspace privacy
              </h4>
              <p className="text-sm font-light text-slate-400 leading-relaxed">
                We use cookies to secure your account session, remember your active Brand DNA workspace, and customize your guided tutorial steps. You can review our preferences guidelines in the{" "}
                <Link
                  to="/privacy"
                  className="text-[#C084FC] hover:underline font-normal transition-all"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10 rounded-lg"
              >
                Decline optional
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-2.5 bg-white text-black hover:bg-slate-200 text-sm font-semibold rounded-lg shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
              >
                Accept cookies
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
