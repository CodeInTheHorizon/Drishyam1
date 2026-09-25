/**
 * ============================================================================
 * File: src/components/AIChat/AIChat.tsx
 * ----------------------------------------------------------------------------
 * Main AI Chat Component
 *
 * This component composes the entire chatbot.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Uses useChat() hook
 * • Renders layout
 * • Connects child components
 * • Contains NO API logic
 * ============================================================================
 */

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import SuggestedQuestions from "./SuggestedQuestions";

import GlassPanel from "../ui/GlassPanel";

import useChat from "../../hooks/useChat";

export default function AIChat() {

    /**
     * Chat hook.
     */
    const {

        messages,

        loading,

        send,

        bottomRef,

    } = useChat();

    /**
     * Handle clicking a suggested question.
     */
    function handleSuggestion(question: string) {

        if (loading) return;

        send(question);

    }

    /**
     * Handle manual message.
     */
    function handleSend(message: string) {

        send(message);

    }

    return (

        <GlassPanel

            className="
                flex
                flex-col
                h-[760px]
                w-full
            "

        >

            {/* =======================================================
                            Header
            ======================================================= */}

            <ChatHeader />

            {/* =======================================================
                        Conversation
            ======================================================= */}

            <MessageList

                messages={messages}

                loading={loading}

                bottomRef={bottomRef}

            />

            {/* =======================================================
                    Suggested Questions
            ======================================================= */}

            <div

                className="
                    px-5
                    pb-3
                    overflow-x-auto
                "

            >

                <SuggestedQuestions

                    disabled={loading}

                    onSelect={handleSuggestion}

                />

            </div>

            {/* =======================================================
                            Input
            ======================================================= */}

            <ChatInput

                disabled={loading}

                onSend={handleSend}

            />

        </GlassPanel>

    );

}