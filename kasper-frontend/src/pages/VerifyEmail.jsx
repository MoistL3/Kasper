import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, AuthLayout, Icon } from '../components/UI';

const RESEND_SECONDS = 60; // نفس الـ cooldown بتاع الباك إند

export default function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyEmail, resendCode } = useAuth();

    // الإيميل جاي من صفحة التسجيل/الدخول عن طريق router state (بيفضل موجود بعد الـ refresh)
    const email = location.state?.email;

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_SECONDS);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    // لو حد فتح الصفحة مباشرة من غير إيميل، مفيش حاجة نتحقق منها
    if (!email) {
        return <Navigate to="/register" replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setInfo('');

        if (code.length !== 6) {
            setError('Please enter the 6-digit code.');
            return;
        }

        setSubmitting(true);
        try {
            await verifyEmail(email, code);
            navigate('/profile', { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to verify your email. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResend() {
        setError('');
        setInfo('');
        setResending(true);
        try {
            await resendCode(email);
            setCode('');
            setCooldown(RESEND_SECONDS);
            setInfo('A new code is on its way. Check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not resend the code. Please try again.');
        } finally {
            setResending(false);
        }
    }

    return (
        <AuthLayout>
            <section className="auth-card w-full max-w-[430px] rounded-2xl border border-white/[0.08] bg-[#11161f]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
                <div className="mb-8">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
                        One last step
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white">
                        Verify your email
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        We sent a 6-digit code to{' '}
                        <span className="font-medium text-slate-300">{email}</span>. It expires in 10
                        minutes.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && <Alert message={error} />}
                    {info && (
                        <div
                            role="status"
                            className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3.5 py-3 text-[13px] leading-5 text-emerald-300"
                        >
                            {info}
                        </div>
                    )}

                    <div>
                        <label htmlFor="code" className="mb-2 block text-[13px] font-medium text-slate-300">
                            Verification code
                        </label>
                        <input
                            id="code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={code}
                            disabled={submitting}
                            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="h-14 w-full rounded-lg border border-white/10 bg-[#111720] px-3.5 text-center text-2xl font-semibold tracking-[0.5em] text-white outline-none transition placeholder:text-slate-700 focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || code.length !== 6}
                        className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Verifying...' : 'Verify email'}
                        {!submitting && (
                            <Icon
                                name="arrow"
                                className="size-4 transition-transform group-hover:translate-x-0.5"
                            />
                        )}
                    </button>
                </form>

                <div className="my-7 h-px bg-white/[0.07]" />

                <div className="space-y-3 text-center text-sm text-slate-500">
                    <p>
                        Didn&apos;t get the code?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={cooldown > 0 || resending}
                            className="font-medium text-violet-400 transition hover:text-violet-300 disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:text-slate-600"
                        >
                            {resending
                                ? 'Sending...'
                                : cooldown > 0
                                    ? `Resend in ${cooldown}s`
                                    : 'Resend code'}
                        </button>
                    </p>
                    <p>
                        Wrong email?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-violet-400 transition hover:text-violet-300"
                        >
                            Start over
                        </Link>
                    </p>
                </div>
            </section>
        </AuthLayout>
    );
}