/**
 * ============================================================================
 * File: src/services/chatApi.ts
 * ----------------------------------------------------------------------------
 * AI Chat Service
 *
 * Handles communication between the React application and the
 * Catalyst AI Agent backend.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Send officer questions
 * • Receive AI Agent responses
 * • Handle timeout
 * • Handle network errors
 * • Return typed response
 * ============================================================================
 */

import type {

    ChatRequest,

    ChatResponse

} from "../types/chat";

const API_URL = "/api/chat";

const REQUEST_TIMEOUT = 20000;

/**
 * Send question to AI Agent.
 */
export async function sendMessage(

    message: string

): Promise<ChatResponse> {

    const controller = new AbortController();

    const timeout = setTimeout(() => {

        controller.abort();

    }, REQUEST_TIMEOUT);

    try {

        const payload: ChatRequest = {

            message

        };

        const response = await fetch(

            API_URL,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(payload),

                signal: controller.signal

            }

        );

        clearTimeout(timeout);

        if (!response.ok) {

            throw new Error(

                `HTTP ${response.status}`

            );

        }

        const data: ChatResponse =

            await response.json();

        /**
         * Validate backend response.
         */
        if (

            !data ||

            !data.success ||

            !data.reply

        ) {

            throw new Error(

                "Invalid response from AI backend."

            );

        }

        return data;

    }

    catch (error: any) {

        clearTimeout(timeout);

        if (

            error.name === "AbortError"

        ) {

            throw new Error(

                "The AI service took too long to respond."

            );

        }

        throw new Error(

            error.message ||

            "Unable to contact AI service."

        );

    }

}