/**
 * ============================================================================
 * File: functions/chat/cache.js
 * ----------------------------------------------------------------------------
 * Simple in-memory cache for analytics.
 *
 * NOTE:
 * Replace this with Catalyst Cache later for production deployment.
 * ============================================================================
 */

let analyticsCache = {

    data: null,

    timestamp: null

};

/**
 * Cache duration.
 *
 * 5 Minutes
 */
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Returns cached analytics if still valid.
 */
function getAnalytics() {

    if (

        analyticsCache.data &&

        analyticsCache.timestamp &&

        Date.now() - analyticsCache.timestamp < CACHE_DURATION

    ) {

        return analyticsCache.data;

    }

    return null;

}

/**
 * Save analytics.
 */
function setAnalytics(data) {

    analyticsCache = {

        data,

        timestamp: Date.now()

    };

}

/**
 * Clear cache manually.
 */
function clearAnalytics() {

    analyticsCache = {

        data: null,

        timestamp: null

    };

}

module.exports = {

    getAnalytics,

    setAnalytics,

    clearAnalytics

};