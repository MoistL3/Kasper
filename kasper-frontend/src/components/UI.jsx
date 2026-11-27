export function Icon({ name, className = 'size-5' }) {
    const paths = {
        arrow: <path d="m9 18 6-6-6-6" />,
        chevron: <path d="m15 18-6-6 6-6" />,
        folder: (
            <path d="M3.8 6.8A1.8 1.8 0 0 1 5.6 5h3l2 2h7.8a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.6a1.8 1.8 0 0 1-1.8-1.8Z" />
        ),
        grid: (
            <>
                <rect width="6" height="6" x="4" y="4" rx="1" />
                <rect width="6" height="6" x="14" y="4" rx="1" />
                <rect width="6" height="6" x="4" y="14" rx="1" />
                <rect width="6" height="6" x="14" y="14" rx="1" />
            </>
        ),
        logout: (
            <>
                <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" />
                <path d="m15 16 4-4-4-4M19 12H9" />
            </>
        ),
        menu: <path d="M5 7h14M5 12h14M5 17h14" />,
        plus: <path d="M12 5v14M5 12h14" />,
        settings: (
            <>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
            </>
        ),
        sparkles: (
            <>
                <path d="m12 3 .8 2.2A6.2 6.2 0 0 0 16.5 9l2.2.8-2.2.8a6.2 6.2 0 0 0-3.7 3.7l-.8 2.2-.8-2.2a6.2 6.2 0 0 0-3.7-3.7l-2.2-.8L7.5 9a6.2 6.2 0 0 0 3.7-3.8Z" />
                <path d="m18.5 15 .3.9a3 3 0 0 0 1.8 1.8l.9.3-.9.3a3 3 0 0 0-1.8 1.8l-.3.9-.3-.9a3 3 0 0 0-1.8-1.8l-.9-.3.9-.3a3 3 0 0 0 1.8-1.8Z" />
            </>
        ),
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
        camera: (
            <>
                <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3Z" />
                <circle cx="12" cy="12" r="3.5" />
            </>
        ),
        trash: (
            <>
                <path d="M4 7h16" />
                <path d="M10 11v6M14 11v6" />
                <path d="m6 7 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                <path d="M9 7V4h6v3" />
            </>
        ),
    };

    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {paths[name]}
        </svg>
    );
}

export function Logo({ compact = false }) {
    return (
        <div className="flex items-center gap-3">
            <div className="brand-mark" aria-hidden="true">
                <span />
                <span />
            </div>
            {!compact && (
                <>
                    <span className="text-[19px] font-semibold tracking-[-0.03em] text-white">Kasper</span>
                    {/* الـ wrapper بيتقص (overflow hidden) والـ border جوه الـ span الداخلي */}
                    <span className="tagline hidden sm:inline-block">
                        <span className="block whitespace-nowrap border-l border-white/10 pl-3 text-xs font-medium text-violet-300">
                            your smart academic assistant
                        </span>
                    </span>
                </>
            )}
        </div>
    );
}

export function Field({
                          label,
                          type = 'text',
                          placeholder,
                          value,
                          onChange,
                          autoComplete,
                          hint,
                          disabled = false,
                      }) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <label htmlFor={id} className="text-[13px] font-medium text-slate-300">
                    {label}
                </label>
                {hint && <span className="text-xs text-slate-500">{hint}</span>}
            </div>
            <input
                id={id}
                type={type}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="h-11 w-full rounded-lg border border-white/10 bg-[#111720] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50"
            />
        </div>
    );
}

export function SelectField({
                                label,
                                value,
                                onChange,
                                options,
                                placeholder,
                                hint,
                                disabled = false,
                            }) {
    const id = label.toLowerCase().replaceAll(' ', '-');

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <label htmlFor={id} className="text-[13px] font-medium text-slate-300">
                    {label}
                </label>
                {hint && <span className="text-xs text-slate-500">{hint}</span>}
            </div>
            <select
                id={id}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-[#111720] px-3 text-sm text-white outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function AuthLayout({ children }) {
    return (
        <main className="auth-bg relative flex min-h-screen flex-col overflow-hidden px-5 py-7 sm:px-8">
            <div className="auth-glow" />
            <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
                <Logo />
                <span className="hidden text-xs font-medium tracking-wide text-slate-600 sm:block">
          SECURE WORKSPACE
        </span>
            </header>
            <div className="relative z-10 flex flex-1 items-center justify-center py-12">{children}</div>
            <p className="relative z-10 text-center text-xs text-slate-600">
                © {new Date().getFullYear()} Team Kasper. All rights reserved.
            </p>
        </main>
    );
}

export function Alert({ message }) {
    return (
        <div
            role="alert"
            className="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.08] px-3.5 py-3 text-[13px] leading-5 text-red-300"
        >
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-red-400/70 text-[10px] font-bold">
        !
      </span>
            <span>{message}</span>
        </div>
    );
}