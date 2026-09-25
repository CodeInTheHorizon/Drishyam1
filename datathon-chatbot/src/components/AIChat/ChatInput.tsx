/**
 * ============================================================================
 * File: src/components/AIChat/ChatInput.tsx
 * ----------------------------------------------------------------------------
 * Enterprise Chat Input
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Collect user question
 * • Auto resize textarea
 * • Enter -> Send
 * • Shift + Enter -> New line
 * • Character counter
 * • Disable while AI is thinking
 * • Clear after sending
 *
 * This component contains NO API calls.
 * It simply emits the entered message.
 * ============================================================================
 */

import {
    useEffect,
    useRef,
    useState,
    KeyboardEvent
} from "react";

import { motion } from "framer-motion";

import {
    SendHorizontal,
    X
} from "lucide-react";

interface ChatInputProps {

    /**
     * Called when user presses Send.
     */
    onSend(message: string): void;

    /**
     * Disable input while AI is responding.
     */
    disabled?: boolean;

}

const MAX_CHARACTERS = 500;

export default function ChatInput({

    onSend,

    disabled = false

}: ChatInputProps) {

    const [message, setMessage] = useState("");

    const textareaRef =
        useRef<HTMLTextAreaElement>(null);

    /**
     * Auto resize textarea.
     */
    useEffect(() => {

        const textarea = textareaRef.current;

        if (!textarea) return;

        textarea.style.height = "0px";

        textarea.style.height =
            textarea.scrollHeight + "px";

    }, [message]);

    /**
     * Send message.
     */
    function handleSend() {

        const trimmed = message.trim();

        if (!trimmed) return;

        onSend(trimmed);

        setMessage("");

    }

    /**
     * Keyboard shortcuts.
     */
    function handleKeyDown(

        e: KeyboardEvent<HTMLTextAreaElement>

    ) {

        /**
         * Enter
         *
         * Send message.
         */
        if (

            e.key === "Enter"

            &&

            !e.shiftKey

        ) {

            e.preventDefault();

            handleSend();

        }

    }

    return (

        <div
            className="
                border-t
                border-white/10
                bg-white/5
                backdrop-blur-xl
                p-4
            "
        >

            {/* Textarea */}

            <div
                className="
                    rounded-2xl
                    border
                    border-slate-300
                    dark:border-slate-700
                    bg-white
                    dark:bg-slate-900
                    overflow-hidden
                    shadow-sm
                "
            >

                <textarea

                    ref={textareaRef}

                    rows={1}

                    value={message}

                    disabled={disabled}

                    maxLength={MAX_CHARACTERS}

                    onChange={(e) =>
                        setMessage(e.target.value)
                    }

                    onKeyDown={handleKeyDown}

                    placeholder="Ask about crime statistics..."

                    className="
                        w-full
                        resize-none
                        bg-transparent
                        px-4
                        py-3
                        outline-none
                        max-h-48
                    "

                />

                {/* Bottom Toolbar */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        px-3
                        py-2
                        border-t
                        border-slate-200
                        dark:border-slate-700
                    "
                >

                    {/* Character Counter */}

                    <span
                        className="
                            text-xs
                            text-slate-500
                        "
                    >

                        {message.length} / {MAX_CHARACTERS}

                    </span>

                    <div className="flex gap-2">

                        {/* Clear */}

                        <motion.button

                            whileHover={{
                                scale: 1.05
                            }}

                            whileTap={{
                                scale: 0.95
                            }}

                            disabled={
                                disabled ||

                                message.length === 0
                            }

                            onClick={() =>
                                setMessage("")
                            }

                            className="
                                p-2
                                rounded-xl
                                hover:bg-slate-200
                                dark:hover:bg-slate-700
                            "

                        >

                            <X
                                className="w-4 h-4"
                            />

                        </motion.button>

                        {/* Send */}

                        <motion.button

                            whileHover={{
                                scale: 1.05
                            }}

                            whileTap={{
                                scale: 0.95
                            }}

                            disabled={
                                disabled ||

                                message.trim().length === 0
                            }

                            onClick={handleSend}

                            className="
                                bg-blue-600
                                hover:bg-blue-700
                                disabled:bg-slate-400
                                text-white
                                px-5
                                py-2
                                rounded-xl
                                flex
                                items-center
                                gap-2
                                transition-colors
                            "

                        >

                            <SendHorizontal
                                className="w-4 h-4"
                            />

                            Send

                        </motion.button>

                    </div>

                </div>

            </div>

        </div>

    );

}