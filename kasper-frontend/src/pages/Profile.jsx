import { useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Avatar from '../components/Avatar';
import { Alert, Icon } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // keep in sync with the backend limit
const MAX_BIO_LENGTH = 300;

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

function Notice({ type, message }) {
    if (type === 'error') return <Alert message={message} />;
    return (
        <div
            role="status"
            className="flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3.5 py-3 text-[13px] leading-5 text-emerald-300"
        >
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-emerald-400/70 text-[10px] font-bold">
                ✓
            </span>
            <span>{message}</span>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3 last:border-b-0">
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-slate-600">{label}</span>
            <span className="truncate text-sm text-slate-200">{value}</span>
        </div>
    );
}

export default function Profile() {
    const { user } = useAuth();
    const {
        profile,
        error: loadError,
        refresh,
        saveBio,
        uploadAvatar,
        removeAvatar,
    } = useProfile();

    const fileInputRef = useRef(null);
    const [bioDraft, setBioDraft] = useState(null); // null = untouched, show server value
    const [savingBio, setSavingBio] = useState(false);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

    if (!profile) {
        return (
            <AppLayout>
                <div className="flex flex-1 items-center justify-center">
                    {loadError ? (
                        <div className="w-full max-w-sm space-y-4 text-center">
                            <Alert message={loadError} />
                            <button
                                type="button"
                                onClick={refresh}
                                className="h-10 rounded-lg border border-white/[0.09] px-4 text-xs font-medium text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <div className="size-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                    )}
                </div>
            </AppLayout>
        );
    }

    const bio = bioDraft ?? profile.bio ?? '';
    const isDirty = bioDraft !== null && bioDraft !== (profile.bio ?? '');

    async function handleFileChange(event) {
        const file = event.target.files?.[0];
        event.target.value = ''; // lets the user pick the same file again later
        if (!file) return;

        setFeedback(null);
        if (!ALLOWED_TYPES.includes(file.type)) {
            setFeedback({ type: 'error', message: 'Only JPEG, PNG or WebP images are allowed.' });
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            setFeedback({ type: 'error', message: 'Image is too large. Max size is 2MB.' });
            return;
        }

        setAvatarBusy(true);
        try {
            await uploadAvatar(file);
            setFeedback({ type: 'success', message: 'Profile photo updated.' });
        } catch (err) {
            setFeedback({
                type: 'error',
                message: errorMessage(err, 'Could not upload the photo. Please try again.'),
            });
        } finally {
            setAvatarBusy(false);
        }
    }

    async function handleRemoveAvatar() {
        setFeedback(null);
        setAvatarBusy(true);
        try {
            await removeAvatar();
            setFeedback({ type: 'success', message: 'Profile photo removed.' });
        } catch (err) {
            setFeedback({
                type: 'error',
                message: errorMessage(err, 'Could not remove the photo. Please try again.'),
            });
        } finally {
            setAvatarBusy(false);
        }
    }

    async function handleSaveBio(event) {
        event.preventDefault();
        if (!isDirty) return;

        setFeedback(null);
        setSavingBio(true);
        try {
            await saveBio(bio);
            setBioDraft(null);
            setFeedback({ type: 'success', message: 'Profile updated.' });
        } catch (err) {
            setFeedback({
                type: 'error',
                message: errorMessage(err, 'Could not save your profile. Please try again.'),
            });
        } finally {
            setSavingBio(false);
        }
    }

    return (
        <AppLayout>
            <div className="mb-8">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">Account</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">
                    Your profile
                </h1>
            </div>

            {feedback && (
                <div className="mb-6 max-w-4xl">
                    <Notice type={feedback.type} message={feedback.message} />
                </div>
            )}

            <div className="grid max-w-4xl items-start gap-6 lg:grid-cols-[280px_1fr]">
                {/* Avatar */}
                <section className="rounded-2xl border border-white/[0.08] bg-[#11161f]/90 p-6">
                    <h2 className="text-sm font-semibold text-white">Profile photo</h2>
                    <p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP. Max 2MB.</p>

                    <div className="mt-6 flex flex-col items-center gap-5">
                        <div className="relative">
                            <Avatar
                                src={profile.avatarUrl}
                                name={user?.name}
                                className="size-28"
                                textClassName="text-3xl"
                            />
                            {avatarBusy && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                                    <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div className="flex w-full flex-col gap-2">
                            <button
                                type="button"
                                disabled={avatarBusy}
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Icon name="camera" className="size-4" />
                                {profile.avatarUrl ? 'Change photo' : 'Upload photo'}
                            </button>

                            {profile.avatarUrl && (
                                <button
                                    type="button"
                                    disabled={avatarBusy}
                                    onClick={handleRemoveAvatar}
                                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.09] text-xs font-medium text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/[0.06] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Icon name="trash" className="size-4" />
                                    Remove photo
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Details */}
                <section className="rounded-2xl border border-white/[0.08] bg-[#11161f]/90 p-6">
                    <h2 className="text-sm font-semibold text-white">Account details</h2>
                    <div className="mt-3">
                        <InfoRow label="Name" value={user?.name} />
                        <InfoRow label="Email" value={user?.email} />
                        <InfoRow label="Role" value={user?.role || 'member'} />
                    </div>

                    <form onSubmit={handleSaveBio} className="mt-6">
                        <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="bio" className="text-[13px] font-medium text-slate-300">
                                Bio
                            </label>
                            <span
                                className={`text-xs ${
                                    bio.length > MAX_BIO_LENGTH ? 'text-red-400' : 'text-slate-500'
                                }`}
                            >
                                {bio.length}/{MAX_BIO_LENGTH}
                            </span>
                        </div>
                        <textarea
                            id="bio"
                            rows={5}
                            value={bio}
                            disabled={savingBio}
                            onChange={(event) => setBioDraft(event.target.value)}
                            placeholder="Tell your team a little about yourself"
                            className="w-full resize-none rounded-lg border border-white/10 bg-[#111720] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50"
                        />

                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={!isDirty || savingBio || bio.length > MAX_BIO_LENGTH}
                                className="h-10 rounded-lg bg-white px-5 text-xs font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {savingBio ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}