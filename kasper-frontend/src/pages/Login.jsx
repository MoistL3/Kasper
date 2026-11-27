import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, AuthLayout, Field, Icon } from '../components/UI';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter both your email and password.');
            return;
        }

        setSubmitting(true);
        try {
            await login(email.trim(), password);
            navigate('/profile', { replace: true });
        } catch (err) {
            // الباسورد صح بس الإيميل لسه مش متأكد: نوديه لصفحة إدخال الكود
            if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
                navigate('/verify-email', { state: { email: email.trim() } });
                return;
            }
            setError(
                err.response?.data?.message || 'Unable to connect to the server. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout>
            <section className="auth-card w-full max-w-[430px] rounded-2xl border border-white/[0.08] bg-[#11161f]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
                <div className="mb-8">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
                        Welcome back
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white">
                        Sign in to Kasper
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Enter your details to access your workspace.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && <Alert message={error} />}

                    <Field
                        label="Email address"
                        type="email"
                        placeholder="you@kasper.dev"
                        value={email}
                        onChange={setEmail}
                        autoComplete="email"
                        disabled={submitting}
                    />

                    <Field
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={setPassword}
                        autoComplete="current-password"
                        disabled={submitting}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Signing in...' : 'Sign in'}
                        {!submitting && (
                            <Icon
                                name="arrow"
                                className="size-4 transition-transform group-hover:translate-x-0.5"
                            />
                        )}
                    </button>
                </form>

                <div className="my-7 h-px bg-white/[0.07]" />

                <p className="text-center text-sm text-slate-500">
                    New to Kasper?{' '}
                    <Link
                        to="/register"
                        className="font-medium text-violet-400 transition hover:text-violet-300"
                    >
                        Create an account
                    </Link>
                </p>
            </section>
        </AuthLayout>
    );
}