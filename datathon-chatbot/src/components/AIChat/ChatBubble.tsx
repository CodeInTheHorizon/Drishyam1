/**
 * ============================================================================
 * File: src/components/AIChat/ChatBubble.tsx
 * ----------------------------------------------------------------------------
 * Renders a single chat message.
 *
 * Features
 * ----------------------------------------------------------------------------
 * • AI/User message styles
 * • Markdown support
 * • Tables
 * • Bullet lists
 * • Code blocks
 * • Timestamp
 * • Message animation
 * • Delivery status
 *
 * This component is presentation-only.
 * ============================================================================
 */

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Bot,
  User,
  Check,
  AlertCircle
} from "lucide-react";

import type { ChatMessage } from "../../types/chat";

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({
  message,
}: ChatBubbleProps) {

  const isUser = message.role === "user";

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 20,
        scale: 0.98,
      }}

      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}

      transition={{
        duration: 0.25,
      }}

      className={`flex mb-5 ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}

    >

      {/* =========================
          AI Avatar
      ========================== */}

      {!isUser && (

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
            shadow-md
            mr-3
            shrink-0
          "
        >

          <Bot
            className="w-5 h-5 text-white"
          />

        </div>

      )}

      {/* =========================
          Message Bubble
      ========================== */}

      <div
        className={`
          max-w-[75%]
          rounded-2xl
          px-5
          py-4
          shadow-lg
          border

          ${
            isUser
              ? `
                bg-blue-600
                text-white
                border-blue-500
              `
              : `
                bg-white/70
                dark:bg-slate-900/70
                backdrop-blur-xl
                border-white/20
                dark:border-slate-700
                text-slate-800
                dark:text-slate-100
              `
          }
        `}
      >

        {/* Markdown Renderer */}

        <ReactMarkdown

          remarkPlugins={[remarkGfm]}

          components={{

            h1: ({ children }) => (
              <h1 className="text-xl font-bold mb-2">
                {children}
              </h1>
            ),

            h2: ({ children }) => (
              <h2 className="text-lg font-semibold mb-2">
                {children}
              </h2>
            ),

            p: ({ children }) => (
              <p className="leading-7 mb-2">
                {children}
              </p>
            ),

            ul: ({ children }) => (
              <ul className="list-disc ml-6 my-2">
                {children}
              </ul>
            ),

            ol: ({ children }) => (
              <ol className="list-decimal ml-6 my-2">
                {children}
              </ol>
            ),

            li: ({ children }) => (
              <li className="mb-1">
                {children}
              </li>
            ),

            code(props) {

              const { children } = props;

              return (

                <code
                  className="
                    bg-black/10
                    dark:bg-black/40
                    px-2
                    py-1
                    rounded
                    text-sm
                    font-mono
                  "
                >

                  {children}

                </code>

              );

            },

            table: ({ children }) => (

              <table
                className="
                  table-auto
                  border
                  border-slate-400
                  mt-3
                  mb-3
                "
              >

                {children}

              </table>

            ),

            th: ({ children }) => (

              <th
                className="
                  border
                  px-3
                  py-2
                  bg-slate-200
                  dark:bg-slate-700
                "
              >

                {children}

              </th>

            ),

            td: ({ children }) => (

              <td
                className="
                  border
                  px-3
                  py-2
                "
              >

                {children}

              </td>

            )

          }}

        >

          {message.content}

        </ReactMarkdown>

        {/* =========================
            Footer
        ========================== */}

        <div
          className="
            flex
            justify-between
            items-center
            mt-3
            text-xs
            opacity-70
          "
        >

          {/* Timestamp */}

          <span>

            {message.timestamp}

          </span>

          {/* Status */}

          <span>

            {message.status === "error" ? (

              <AlertCircle
                className="w-4 h-4"
              />

            ) : (

              <Check
                className="w-4 h-4"
              />

            )}

          </span>

        </div>

      </div>

      {/* =========================
          User Avatar
      ========================== */}

      {isUser && (

        <div
          className="
            w-10
            h-10
            rounded-xl
            bg-slate-800
            flex
            items-center
            justify-center
            ml-3
            shrink-0
          "
        >

          <User
            className="w-5 h-5 text-white"
          />

        </div>

      )}

    </motion.div>

  );

}