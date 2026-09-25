/**
 * ============================================================================
 * File: src/components/ui/GlassPanel.tsx
 * ----------------------------------------------------------------------------
 * Reusable enterprise glass panel.
 *
 * This component provides the base container used across the dashboard.
 *
 * It is intentionally generic so it can wrap:
 *
 * • AI Chat
 * • AI Insights
 * • Charts
 * • Crime Statistics
 * • Heatmaps
 * • Officer Cards
 *
 * This avoids repeating large Tailwind class strings throughout the app.
 * ============================================================================
 */

import { motion } from "framer-motion";
import clsx from "clsx";
import { ReactNode } from "react";

interface GlassPanelProps {

    /**
     * Child components.
     */
    children: ReactNode;

    /**
     * Optional Tailwind classes.
     */
    className?: string;

    /**
     * Animate panel on mount.
     */
    animated?: boolean;

}

/**
 * Enterprise Glass Panel
 */
export default function GlassPanel({

    children,

    className,

    animated = true,

}: GlassPanelProps) {

    const Component = animated
        ? motion.div
        : "div";

    return (

        <Component

            initial={
                animated
                    ? {
                          opacity: 0,
                          y: 15,
                      }
                    : undefined
            }

            animate={
                animated
                    ? {
                          opacity: 1,
                          y: 0,
                      }
                    : undefined
            }

            transition={{
                duration: 0.3,
            }}

            className={clsx(

                `
                rounded-3xl

                border

                border-white/10

                dark:border-slate-700

                bg-white/40

                dark:bg-slate-900/60

                backdrop-blur-xl

                shadow-xl

                overflow-hidden
                `,

                className

            )}

        >

            {children}

        </Component>

    );

}