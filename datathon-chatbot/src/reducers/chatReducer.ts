/**
 * ============================================================================
 * File: src/reducers/chatReducer.ts
 * ----------------------------------------------------------------------------
 * Centralized reducer for the AI Chat state.
 *
 * Why useReducer?
 * ----------------------------------------------------------------------------
 * Enterprise applications usually prefer reducers once the state
 * becomes more complex than a few useState() calls.
 *
 * Benefits:
 * - Predictable state updates
 * - Easier debugging
 * - Scalable
 * - Cleaner business logic
 * ============================================================================
 */

import type { ChatMessage } from "../types/chat";

/**
 * Entire state managed by the reducer.
 */
export interface ChatState {

    /**
     * Conversation history.
     */
    messages: ChatMessage[];

    /**
     * Is AI generating?
     */
    loading: boolean;

    /**
     * Current error.
     */
    error: string | null;

}

/**
 * Every possible action.
 */
export type ChatAction =

    | {
        type: "ADD_MESSAGE";
        payload: ChatMessage;
    }

    | {
        type: "SET_LOADING";
        payload: boolean;
    }

    | {
        type: "SET_ERROR";
        payload: string | null;
    }

    | {
        type: "CLEAR_CHAT";
        payload: ChatMessage;
    };

/**
 * Reducer
 */
export function chatReducer(

    state: ChatState,

    action: ChatAction

): ChatState {

    switch (action.type) {

        /**
         * Add new message.
         */
        case "ADD_MESSAGE":

            return {

                ...state,

                messages: [

                    ...state.messages,

                    action.payload

                ]

            };

        /**
         * Toggle loading.
         */
        case "SET_LOADING":

            return {

                ...state,

                loading: action.payload

            };

        /**
         * Save latest error.
         */
        case "SET_ERROR":

            return {

                ...state,

                error: action.payload

            };

        /**
         * Reset conversation.
         */
        case "CLEAR_CHAT":

            return {

                messages: [

                    action.payload

                ],

                loading: false,

                error: null

            };

        default:

            return state;

    }

}