/**
 * ============================================================================
 * File: src/components/AIChat/MessageList.tsx
 * ----------------------------------------------------------------------------
 * Conversation renderer.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Render all chat messages
 * • Show Typing Indicator
 * • Empty conversation state
 * • Automatic scrolling
 * • Nice animations
 *
 * NO API calls.
 * NO business logic.
 * ============================================================================
 */

import { useEffect, RefObject } from "react";
import { AnimatePresence } from "framer-motion";

import ChatBubble from "./ChatBubble";
import TypingIndicator from "./TypingIndicator";

import type { ChatMessage } from "../../types/chat";


interface MessageListProps {
    messages: ChatMessage[];
    loading: boolean;
    bottomRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageList({

    messages,

    loading,

    bottomRef

}: MessageListProps) {

    /**
     * Whenever messages change,
     * scroll to the latest message.
     */
    useEffect(() => {

        bottomRef.current?.scrollIntoView({

            behavior: "smooth"

        });

    }, [messages, loading, bottomRef]);

    return (

        <div

            className="
                flex-1
                overflow-y-auto
                px-6
                py-6
                space-y-2
            "

        >

            {/* ==========================
                Empty State
            =========================== */}

            {messages.length === 0 && (

                <div

                    className="
                        h-full
                        flex
                        items-center
                        justify-center
                        text-slate-500
                    "

                >

                    Start a conversation.

                </div>

            )}

            {/* ==========================
                Conversation
            =========================== */}

            <AnimatePresence>

                {

                    messages.map((message) => (

                        <ChatBubble

                            key={message.id}

                            message={message}

                        />

                    ))

                }

            </AnimatePresence>

            {/* ==========================
                Typing Animation
            =========================== */}

            {

                loading &&

                <TypingIndicator />

            }

            {/* ==========================
                Scroll Anchor
            =========================== */}

            <div ref={bottomRef} />

        </div>

    );

}