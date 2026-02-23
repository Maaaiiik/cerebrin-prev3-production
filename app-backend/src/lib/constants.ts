export const API_ROUTES = {
    AGENTS: {
        REQUEST: "/api/agent/request",
        SUMMARY: "/api/agent/summary",
        TEST_INTEGRATION: "/api/integrations/test",
    },
    DOCS: {
        CREATE: "/api/docs/create",
        UPDATE: "/api/docs/update",
        GET_ALL: "/api/docs",
    },
    IDEAS: {
        CREATE: "/api/ideas",
        PROMOTE: "/api/ideas/promote",
    },
    COUNCIL: {
        COMPARE: "/api/council/compare",
    },
} as const;

export const APP_CONFIG = {
    MAX_AGENTS_PER_WORKSPACE: 10,
    DEFAULT_WEIGHT: 1,
    REALTIME_CHANNELS: {
        APPROVAL_QUEUE: "agent_approval_queue_changes",
        ACTIVITY_FEED: "activity_feed_changes",
    },
} as const;
