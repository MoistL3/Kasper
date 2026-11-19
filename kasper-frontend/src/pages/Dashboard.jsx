import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, Logo } from '../components/UI';

function SidebarLink({ icon, label, active = false, collapsed }) {
    return (
        <button
            type="button"
            title={collapsed ? label : undefined}
            className={`flex h-10 w-full items-center rounded-lg text-sm transition ${
                collapsed ? 'justify-center' : 'gap-3 px-3'
            } ${
                active
                    ? 'bg-violet-500/10 text-violet-300'
                    : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-200'
            }`}
        >
            <Icon name={icon} className="size-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
        </button>
    );
}

export default function Dashboard() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <main className="flex min-h-screen bg-[#0c1017] text-slate-200">
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex border-r border-white/[0.07] bg-[#0f141c] transition-[width] duration-300 lg:static ${
                    collapsed ? 'w-[76px]' : 'w-[232px]'
                }`}
            >
                <div className="flex min-w-0 flex-1 flex-col">
                    <div
                        className={`flex h-[72px] items-center border-b border-white/[0.07] ${
                            collapsed ? 'justify-center' : 'px-5'
                        }`}
                    >
                        <Logo compact={collapsed} />
                    </div>

                    <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
                        <SidebarLink icon="grid" label="Workspace" active collapsed={collapsed} />
                        <SidebarLink icon="folder" label="Projects" collapsed={collapsed} />
                        <SidebarLink icon="settings" label="Settings" collapsed={collapsed} />
                    </nav>

                    {!collapsed && (
                        <div className="m-3 rounded-xl border border-violet-400/10 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
                            <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                                <Icon name="sparkles" className="size-4" />
                            </div>
                            <p className="text-xs font-semibold text-slate-200">Kasper workspace</p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-500">
                                Everything your team needs, in one place.
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="flex h-14 items-center justify-center border-t border-white/[0.07] text-slate-500 transition hover:bg-white/[0.03] hover:text-white"
                    >
                        <Icon
                            name="chevron"
                            className={`size-[18px] transition-transform duration-300 ${
                                collapsed ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                </div>
            </aside>

            <section
                className={`min-w-0 flex-1 transition-[margin] duration-300 ${
                    collapsed ? 'ml-[76px] lg:ml-0' : 'ml-[232px] lg:ml-0'
                }`}
            >
                <header className="flex h-[72px] items-center justify-between border-b border-white/[0.07] bg-[#0c1017]/90 px-5 backdrop-blur sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setCollapsed(!collapsed)}
                            className="text-slate-400 transition hover:text-white lg:hidden"
                            aria-label="Toggle sidebar"
                        >
                            <Icon name="menu" />
                        </button>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                                {user?.name || 'Kasper User'}
                            </p>
                            <p className="hidden text-xs text-slate-500 sm:block">{user?.email}</p>
                        </div>
                        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-300">
              {user?.role || 'member'}
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
                </header>

                <div className="flex min-h-[calc(100vh-72px)] flex-col p-5 sm:p-7 lg:p-10">
                    <div className="mb-8">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                            Workspace
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
                            Your projects
                        </h1>
                    </div>

                    <div className="workspace-grid flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/[0.09] bg-[#0e131b] px-6 py-16">
                        <div className="max-w-sm text-center">
                            <div className="empty-icon mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#141a24] text-violet-400 shadow-xl shadow-black/20">
                                <Icon name="folder" className="size-7" />
                            </div>
                            <h2 className="text-lg font-semibold tracking-[-0.025em] text-white">
                                Your workspace is ready
                            </h2>
                            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                Create your first project and start turning your ideas into focused, collaborative
                                work.
                            </p>
                            <button
                                type="button"
                                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
                            >
                                <Icon name="plus" className="size-4" />
                                New project
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}