import { useState } from 'react';

export default function Avatar({
                                   src,
                                   name = '',
                                   className = 'size-9',
                                   textClassName = 'text-xs',
                               }) {
    const [failedSrc, setFailedSrc] = useState(null);

    const initials =
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase())
            .join('') || '?';

    if (src && failedSrc !== src) {
        return (
            <img
                src={src}
                alt=""
                onError={() => setFailedSrc(src)}
                className={`${className} shrink-0 rounded-full border border-white/10 object-cover`}
            />
        );
    }

    return (
        <div
            aria-hidden="true"
            className={`${className} ${textClassName} flex shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/15 font-semibold text-violet-300`}
        >
            {initials}
        </div>
    );
}