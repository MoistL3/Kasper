import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import Avatar from './Avatar';
import { Icon, Logo } from './UI';

export default function AppLayout({ children }) {
    const { user, logout } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <main className="min-h-screen bg-[#0c1017] text-slate-200">
            <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0c1017]/90 backdrop-blur">
                <div className="mx-auto flex h-[72px] w-full max-w-5xl items-center justify-between px-5 sm:px-7">
                    <Logo />

                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <Avatar src={profile?.avatarUrl} name={user?.name} className="size-9" />
                            <div className="hidden min-w-0 sm:block">
                                <p className="truncate text-sm font-medium text-white">
                                    {user?.name || 'Kasper User'}
                                </p>
                                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                            </div>
                            <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-300">
                                {user?.role || 'student'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] px-3 text-xs font-medium text-slate-400 transition hover:border-white/15 hover:bg-white/[0.04] hover:text-white"
                        >
                            <Icon name="logout" className="size-4" />
                            <span className="hidden sm:inline">Log out</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-5xl flex-col px-5 py-8 sm:px-7 lg:py-10">
                {children}
            </div>
        </main>
    );
}