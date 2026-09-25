/**
 * ============================================================================
 * File: src/types/chat.ts
 * ----------------------------------------------------------------------------
 * Shared TypeScript interfaces for the AI Crime Intelligence Assistant.
 *
 * Keeping interfaces here avoids duplication and ensures every component
 * works with the same strongly-typed data model.
 * ============================================================================
 */

/**
 * Indicates who sent a message.
 */
export type MessageRole = "user" | "assistant";

/**
 * Represents the status of a message.
 * Useful for showing "sending..." or retry states later.
 */
export type MessageStatus =
  | "sending"
  | "sent"
  | "error";

/**
 * A single chat message displayed in the conversation.
 */
export interface ChatMessage {
  /**
   * Unique identifier.
   * Used as React key.
   */
  id: string;

  /**
   * User or AI.
   */
  role: MessageRole;

  /**
   * Actual message text.
   */
  content: string;

  /**
   * Human readable timestamp.
   *
   * Example:
   * "10:42 AM"
   */
  timestamp: string;

  /**
   * Optional delivery state.
   */
  status?: MessageStatus;
}

/**
 * Payload sent to the backend.
 */
export interface ChatRequest {
  message: string;
}

/**
 * Response returned by Catalyst Function.
 */
export interface ChatRequest {

    message: string;

}

export interface ChatResponse {
    success: boolean;
    reply: string;
    source?: string;
    data?: ChatToolData;
    timestamp: string;
}

/**
 * Suggested question chip shown below the chat.
 */
export interface SuggestedQuestion {
  id: number;
  text: string;
}

/**
 * Generic API Error.
 */
export interface ApiError {
  message: string;
}

export interface ChatToolData {
    district?: {
        name: string;
        count: number;
    };
    officer?: {
        name: string;
        count: number;
    };
    ranking?: Array<{
        name: string;
        count: number;
    }>;
}