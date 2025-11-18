import { createBrowserRouter } from 'react-router-dom';
import Shell from './layout/Shell';
import Questionnaire from '../pages/onboarding/Questionnaire';
import People from '../pages/recommendations/People';
import Groups from '../pages/recommendations/Groups';
import Chats from '../pages/chats/Chats';
import Settings from '../pages/settings/Settings';
import UserProfile from '../pages/profile/UserProfile';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Shell />,
        children: [
            { index: true, element: <People /> },
            { path: 'recommendations/groups', element: <Groups /> },
            { path: 'onboarding', element: <Questionnaire /> },
            { path: 'chats', element: <Chats /> },
            { path: 'settings', element: <Settings /> },
            { path: 'profile/:id', element: <UserProfile /> },
        ],
    },
]);
