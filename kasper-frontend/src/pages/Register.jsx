import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, AuthLayout, Field, Icon, SelectField } from '../components/UI';
import { getAcademicStructure } from '../api/academic';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [college, setCollege] = useState('');
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [structure, setStructure] = useState(null);
    const [structureFailed, setStructureFailed] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        getAcademicStructure()
            .then((data) => {
                if (!cancelled) setStructure(data);
            })
            .catch(() => {
                if (!cancelled) setStructureFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const colleges = structure ? Object.keys(structure) : [];
    const departments = structure && college ? structure[college] ?? [] : [];

    // لو الكلية اتغيرت، القسم القديم ممكن مايبقاش تابع لها
    function handleCollegeChange(value) {
        setCollege(value);
        setDepartment('');
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        const trimmedName = name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 80) {
            setError('Name must be between 2 and 80 characters.');
            return;
        }
        if (!email.includes('@')) {
            setError('Please provide a valid email address.');
            return;
        }
        if (!college || !department) {
            setError('Please select your college and department.');
            return;
        }
        if (password.length < 8 || password.length > 72) {
            setError('Password must be between 8 and 72 characters.');
            return;
        }

        setSubmitting(true);
        try {
            const registeredEmail = await register({
                name: trimmedName,
                email: email.trim(),
                password,
                college,
                department,
            });
            // مفيش دخول لسه: لازم يأكد الإيميل الأول
            navigate('/verify-email', { state: { email: registeredEmail }, replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to create your account. Please try again.'
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
                        Get started
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-white">
                        Create your account
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">Your next workspace is just a moment away.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && <Alert message={error} />}
                    {structureFailed && (
                        <Alert message="Could not load colleges. Please refresh the page." />
                    )}

                    <Field
                        label="Full name"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={setName}
                        autoComplete="name"
                        disabled={submitting}
                    />

                    <Field
                        label="Email address"
                        type="email"
                        placeholder="you@kasper.dev"
                        value={email}
                        onChange={setEmail}
                        autoComplete="email"
                        disabled={submitting}
                    />

                    <SelectField
                        label="College"
                        placeholder={structure ? 'Select your college' : 'Loading...'}
                        value={college}
                        onChange={handleCollegeChange}
                        options={colleges}
                        disabled={submitting || !structure}
                    />

                    <SelectField
                        label="Department"
                        placeholder={college ? 'Select your department' : 'Select a college first'}
                        value={department}
                        onChange={setDepartment}
                        options={departments}
                        disabled={submitting || !college}
                    />

                    <Field
                        label="Password"
                        type="password"
                        placeholder="Create a secure password"
                        value={password}
                        onChange={setPassword}
                        autoComplete="new-password"
                        hint="8 characters minimum"
                        disabled={submitting}
                    />

                    <button
                        type="submit"
                        disabled={submitting || !structure}
                        className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Creating account...' : 'Create account'}
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
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-medium text-violet-400 transition hover:text-violet-300"
                    >
                        Sign in
                    </Link>
                </p>
            </section>
        </AuthLayout>
    );
}