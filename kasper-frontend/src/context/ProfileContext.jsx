import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import * as profileApi from '../api/profile';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
    const { user } = useAuth();
    // /auth/login returns `id`, /auth/me returns `_id`
    const userId = user?.id ?? user?._id ?? null;

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    // Load the profile whenever a user logs in; clear it on logout
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!userId) {
                setProfile(null);
                setError('');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const data = await profileApi.getMyProfile();
                if (!cancelled) setProfile(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || 'Could not load your profile.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [userId, reloadKey]);

    const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

    const saveBio = useCallback(async (bio) => {
        const updated = await profileApi.updateMyProfile({ bio });
        setProfile(updated);
        return updated;
    }, []);

    const uploadAvatar = useCallback(async (file) => {
        const updated = await profileApi.uploadAvatar(file);
        setProfile(updated);
        return updated;
    }, []);

    const removeAvatar = useCallback(async () => {
        const updated = await profileApi.removeAvatar();
        setProfile(updated);
        return updated;
    }, []);

    const value = useMemo(
        () => ({ profile, loading, error, refresh, saveBio, uploadAvatar, removeAvatar }),
        [profile, loading, error, refresh, saveBio, uploadAvatar, removeAvatar]
    );

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used inside a ProfileProvider');
    }
    return context;
}