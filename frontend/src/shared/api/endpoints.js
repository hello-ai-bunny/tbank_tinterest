export const Endpoints = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
    },
    USERS: {
        ME: '/users/me',
        LIST: '/users',
    },
    RECOMMENDATIONS: {
        LIST: '/recommendations',
        HIDE: (id) => `/recommendations/${id}/hide`,
    },
    SURVEY: {
        INTERESTS: '/survey/interests',
        MY_INTERESTS: '/survey/me/interests',
    },
    CHATS: {
        LIST: '/chats',
        BASE: '/chats',
        WS: '/ws/chats',
    },
};
