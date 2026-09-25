/**
 * ============================================================================
 * File: src/components/AIChat/ChatHeader.tsx
 * ----------------------------------------------------------------------------
 * Enterprise Chat Header
 *
 * Displays:
 * • Shield icon
 * • AI title
 * • Online status
 * • QuickML badge
 * • Last updated text
 *
 * This component is purely presentational.
 * It contains NO business logic.
 * ============================================================================
 */

import { motion } from "framer-motion";

import {
  ShieldCheck,
  Cpu,
  Circle
} from "lucide-react";

/**
 * Header Component
 */
export default function ChatHeader() {

  return (

    <motion.header

      initial={{ opacity: 0, y: -20 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.4 }}

      className="
        flex
        items-center
        justify-between
        p-5
        border-b
        border-white/10
        backdrop-blur-xl
        bg-white/5
        rounded-t-2xl
      "

    >

      {/* ==========================
          LEFT SIDE
      =========================== */}

      <div className="flex items-center gap-4">

        {/* Shield Icon */}

        <div
          className="
            w-12
            h-12
            rounded-xl
            bg-gradient-to-br
            from-blue-500
            to-indigo-600
            flex
            items-center
            justify-center
            shadow-lg
          "
        >

          <ShieldCheck className="w-6 h-6 text-white" />

        </div>

        {/* Title */}

        <div>

          <h2
            className="
              text-xl
              font-bold
              tracking-wide
              text-slate-900
              dark:text-white
            "
          >

            AI Crime Intelligence Assistant

          </h2>

          <p
            className="
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >

            Karnataka State Police Analytics

          </p>

        </div>

      </div>

      {/* ==========================
          RIGHT SIDE
      =========================== */}

      <div className="flex items-center gap-4">

        {/* Online Status */}

        <div
          className="
            flex
            items-center
            gap-2
            rounded-full
            px-3
            py-1
            bg-green-500/10
            border
            border-green-500/30
          "
        >

          {/* Animated Green Dot */}

          <motion.div

            animate={{
              scale: [1, 1.25, 1]
            }}

            transition={{
              repeat: Infinity,
              duration: 1.5
            }}

          >

            <Circle
              className="w-3 h-3 fill-green-500 text-green-500"
            />

          </motion.div>

          <span
            className="
              text-xs
              font-medium
              text-green-600
              dark:text-green-400
            "
          >

            Online

          </span>

        </div>

        {/* QuickML Badge */}

        <div
          className="
            hidden
            md:flex
            items-center
            gap-2
            px-3
            py-2
            rounded-xl
            bg-slate-100
            dark:bg-slate-800
            border
            border-slate-200
            dark:border-slate-700
          "
        >

          <Cpu
            className="
              w-4
              h-4
              text-indigo-500
            "
          />

          <span
            className="
              text-xs
              font-semibold
            "
          >

            Powered by QuickML

          </span>

        </div>

      </div>

    </motion.header>

  );

}