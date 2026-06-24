import { useEffect } from 'react';
import { useAuth } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

export default function InactivityWatcher() {
    const { currentUser, logout, inactivityTimeoutMinutes } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        let timeoutId;
        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                logout();
                navigate('/login');
            }, inactivityTimeoutMinutes * 60 * 1000);
        };

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

        const handleEvent = () => resetTimer();

        events.forEach(e => window.addEventListener(e, handleEvent));
        resetTimer();

        return () => {
            clearTimeout(timeoutId);
            events.forEach(e => window.removeEventListener(e, handleEvent));
        };
    }, [currentUser, logout, inactivityTimeoutMinutes, navigate]);

    return null;
}
