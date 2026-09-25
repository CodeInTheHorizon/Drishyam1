/**
 * ============================================================================
 * File: functions/chat/constants.js
 * ----------------------------------------------------------------------------
 * Centralized constants used throughout the AI Chat backend.
 *
 * Benefits:
 * - No magic strings
 * - Easier maintenance
 * - Easy to update
 * ============================================================================
 */

/**
 * Maximum number of records to analyse.
 *
 * Prevents sending huge datasets to QuickML.
 */
const MAX_RECORDS = 5000;

/**
 * Maximum number of AI insights.
 */
const MAX_INSIGHTS = 8;

/**
 * Case status values.
 *
 * Update these according to your
 * actual Catalyst Data Store values.
 */
const CASE_STATUS = {

    PENDING: "Pending",

    RESOLVED: "Resolved",

    CHARGESHEET: "Charge Sheet Filed"

};

/**
 * Supported AI insight types.
 */
const INSIGHT_TYPES = {

    CRITICAL: "critical",

    WARNING: "warning",

    SUCCESS: "success",

    INFO: "info"

};

/**
 * Default AI model temperature.
 *
 * Lower = more factual.
 */
const QUICKML = {

    TEMPERATURE: 0.2,

    MAX_TOKENS: 700

};

module.exports = {

    MAX_RECORDS,

    MAX_INSIGHTS,

    CASE_STATUS,

    INSIGHT_TYPES,

    QUICKML

};