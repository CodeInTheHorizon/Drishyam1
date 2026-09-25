/**
 * ============================================================================
 * File: src/components/AIChat/SuggestedQuestions.tsx
 * ----------------------------------------------------------------------------
 * Displays predefined questions that officers can click to quickly
 * interact with the AI assistant.
 *
 * Benefits:
 * • Better UX
 * • Faster demos
 * • Encourages feature discovery
 * • Looks like ChatGPT / Copilot
 *
 * Pure presentation component.
 * ============================================================================
 */

import { motion } from "framer-motion";

import {
    TrendingUp,
    ShieldAlert,
    UserCheck,
    BarChart3,
    MapPinned,
    AlertTriangle
} from "lucide-react";

export interface SuggestedQuestionsProps {

    /**
     * Called when a chip is clicked.
     */
    onSelect(question: string): void;

    /**
     * Disable while AI is generating.
     */
    disabled?: boolean;

}

/**
 * Static suggestions.
 *
 * Later these can come from the backend.
 */
const QUESTIONS = [

    {
        icon: TrendingUp,
        text: "Show cyber crime trend"
    },

    {
        icon: ShieldAlert,
        text: "Highest crime district"
    },

    {
        icon: UserCheck,
        text: "Top performing officer"
    },

    {
        icon: BarChart3,
        text: "Pending FIR summary"
    },

    {
        icon: MapPinned,
        text: "Compare Bengaluru and Mysuru"
    },

    {
        icon: AlertTriangle,
        text: "Show major anomalies"
    }

];

export default function SuggestedQuestions({

    onSelect,

    disabled = false

}: SuggestedQuestionsProps) {

    return (

        <div className="space-y-3">

            {/* Heading */}

            <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">

                    Suggested Questions

                </p>

            </div>

            {/* Chips */}

            <div className="flex flex-wrap gap-3">

                {QUESTIONS.map((question, index) => {

                    const Icon = question.icon;

                    return (

                        <motion.button

                            key={question.text}

                            initial={{
                                opacity: 0,
                                y: 10
                            }}

                            animate={{
                                opacity: 1,
                                y: 0
                            }}

                            transition={{
                                delay: index * 0.05
                            }}

                            whileHover={{
                                scale: 1.05
                            }}

                            whileTap={{
                                scale: 0.97
                            }}

                            disabled={disabled}

                            onClick={() => onSelect(question.text)}

                            className={`
                            
                                flex
                                items-center
                                gap-2

                                rounded-full

                                px-4
                                py-2

                                border

                                backdrop-blur-xl

                                transition-all

                                shadow-sm

                                ${
                                    disabled

                                    ? "opacity-50 cursor-not-allowed"

                                    : `
                                        hover:shadow-lg
                                        hover:border-blue-500
                                        hover:bg-blue-50
                                        dark:hover:bg-slate-800
                                        cursor-pointer
                                      `
                                }

                                bg-white/70
                                dark:bg-slate-900/60

                                border-slate-200
                                dark:border-slate-700

                            `}
                        >

                            <Icon

                                className="
                                    w-4
                                    h-4
                                    text-blue-600
                                "
                            />

                            <span
                                className="
                                    text-sm
                                    font-medium
                                "
                            >

                                {question.text}

                            </span>

                        </motion.button>

                    );

                })}

            </div>

        </div>

    );

}