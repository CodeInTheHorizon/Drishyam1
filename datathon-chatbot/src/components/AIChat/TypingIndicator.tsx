/**
 * ============================================================================
 * File: src/components/AIChat/TypingIndicator.tsx
 * ----------------------------------------------------------------------------
 * Enterprise AI Typing Indicator
 *
 * Displays while the backend (Catalyst + QuickML) is generating
 * a response.
 *
 * Features
 * ----------------------------------------------------------------------------
 * • Animated typing dots
 * • AI avatar
 * • Glassmorphism
 * • Fade animation
 * • Responsive
 *
 * Pure presentation component.
 * ============================================================================
 */

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

/**
 * Small animated typing dot.
 *
 * Using a separate component keeps the JSX clean and
 * allows each dot to have a different animation delay.
 */
function TypingDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="w-2 h-2 rounded-full bg-blue-500"
      animate={{
        y: [0, -4, 0],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        repeat: Infinity,
        duration: 0.8,
        delay,
      }}
    />
  );
}

/**
 * Typing Indicator Component
 */
export default function TypingIndicator() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
      }}
      className="flex items-start gap-3 mb-5"
    >
      {/* =====================
          AI Avatar
      ====================== */}

      <div
        className="
          w-10
          h-10
          rounded-xl
          bg-gradient-to-br
          from-indigo-500
          to-blue-600
          flex
          items-center
          justify-center
          shadow-lg
          shrink-0
        "
      >
        <Bot className="w-5 h-5 text-white" />
      </div>

      {/* =====================
          Bubble
      ====================== */}

      <div
        className="
          rounded-2xl
          px-5
          py-4
          bg-white/70
          dark:bg-slate-900/70
          backdrop-blur-xl
          border
          border-white/20
          dark:border-slate-700
          shadow-lg
          max-w-sm
        "
      >
        {/* Status Text */}

        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-3">
          AI is analyzing Karnataka Police crime data...
        </p>

        {/* Animated Dots */}

        <div className="flex gap-2">

          <TypingDot delay={0} />

          <TypingDot delay={0.2} />

          <TypingDot delay={0.4} />

        </div>
      </div>
    </motion.div>
  );
}