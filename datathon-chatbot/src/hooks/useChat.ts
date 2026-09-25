/**
 * ============================================================================
 * File: src/hooks/useChat.ts
 * ----------------------------------------------------------------------------
 * Custom React Hook
 *
 * This hook contains ALL chat business logic.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Store chat messages
 * • Send messages
 * • Receive AI responses
 * • Show typing indicator
 * • Handle loading state
 * • Handle API errors
 * • Clear conversation
 * • Auto-scroll support
 *
 * Components should NEVER directly call the API.
 * They should only use this hook.
 * ============================================================================
 */

import { useState, useRef, useCallback } from "react";

import { sendMessage } from "../services/chatApi";

import type { ChatMessage } from "../types/chat";

/**
 * Returns current local time.
 *
 * Example:
 * 10:42 AM
 */
function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Custom Hook
 */
export default function useChat() {

  /**
   * Stores the entire conversation.
   */
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
        
      id: crypto.randomUUID(),

      role: "assistant",

      content:
        "👋 Hello Officer.\n\nI am your AI Crime Intelligence Assistant.\n\nAsk me anything about crime statistics, district performance, officer performance, pending cases, or crime trends.",

      timestamp: getCurrentTime(),

      status: "sent",
    },
  ]);

  /**
   * Indicates network request.
   */
  const [loading, setLoading] = useState(false);

  /**
   * Stores latest error.
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * Used for automatic scrolling.
   *
   * Attach this ref to the bottom of the message list.
   */
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /**
   * Scroll chat to latest message.
   */
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  /**
   * Clears previous error.
   */
  function clearError() {
    setError(null);
  }

  /**
   * Clears entire conversation.
   */
  function clearConversation() {

    setMessages([
      {
        id: crypto.randomUUID(),

        role: "assistant",

        content:
          "Conversation cleared.\n\nHow may I assist you now?",

        timestamp: getCurrentTime(),

        status: "sent",
      },
    ]);

    clearError();
  }

  /**
   * Sends a user message.
   */
  async function send(content: string) {

    /**
     * Ignore empty messages.
     */
    if (!content.trim()) return;

    clearError();

    /**
     * Create user message.
     */
    const userMessage: ChatMessage = {

      id: crypto.randomUUID(),

      role: "user",

      content,

      timestamp: getCurrentTime(),

      status: "sent",

    };

    /**
     * Display immediately.
     *
     * Optimistic UI.
     */
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);

    try {

      /**
       * Ask backend.
       */
      const response = await sendMessage(content);

      /**
       * Create assistant message.
       */
      const aiMessage: ChatMessage = {

        id: crypto.randomUUID(),

        role: "assistant",

        content: response.reply,

        timestamp: getCurrentTime(),

        status: "sent",

      };

      /**
       * Display AI response.
       */
      setMessages(prev => [...prev, aiMessage]);

    }

    catch (err: any) {

      setError(err.message);

      /**
       * Friendly fallback.
       */
      setMessages(prev => [

        ...prev,

        {

          id: crypto.randomUUID(),

          role: "assistant",

          content:
            "⚠️ Unable to retrieve information right now.\nPlease try again in a few moments.",

          timestamp: getCurrentTime(),

          status: "error",

        },

      ]);

    }

    finally {

      setLoading(false);

      /**
       * Scroll after DOM updates.
       */
      setTimeout(scrollToBottom, 100);

    }

  }

  /**
   * Public API exposed to components.
   */
  return {

    messages,

    loading,

    error,

    send,

    clearConversation,

    clearError,

    bottomRef,

    scrollToBottom,

  };

}