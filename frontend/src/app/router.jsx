import { createBrowserRouter } from 'react-router-dom';
import Shell from './layout/Shell';
import Questionnaire from '../pages/onboarding/Questionnaire';
import People from '../pages/recomendations/People';
import Chats from '../pages/chats/Chats';
import Settings from '../pages/settings/Settings';
import UserProfile from '../pages/profile/UserProfile';
import Auth from '../pages/auth/Auth';

export const router = createBrowserRouter([
    { path: '/auth', element: <Auth /> },
    {
        path: '/',
        element: <Shell />,
        children: [
            { index: true, element: <People /> },
            { path: 'onboarding', element: <Questionnaire /> },
            { path: 'chats', element: <Chats /> },
            { path: 'settings', element: <Settings /> },
            { path: 'profile/:id', element: <UserProfile /> },
        ],
    },
]);

