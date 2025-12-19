"use client";

import { useEffect, useState } from "react";
import { getLinkMetadata } from "@/lib/actions/chat";

export function LinkPreview({ url }: { url: string }) {
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getLinkMetadata(url).then((data) => {
            if (isMounted) {
                setMetadata(data);
                setLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [url]);

    if (loading) return (
        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-white w-full max-w-sm animate-pulse">
            <div className="h-32 bg-slate-100"></div>
            <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                <div className="h-2 bg-slate-100 rounded w-1/2"></div>
            </div>
        </div>
    );

    if (!metadata || !metadata.title) return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all text-xs mt-1 block">
            {url}
        </a>
    );

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 rounded-xl overflow-hidden border border-slate-200 bg-white hover:bg-slate-50 transition-colors w-full max-w-sm no-underline"
        >
            {metadata.image && (
                <img src={metadata.image} alt="" className="w-full h-32 object-cover border-b border-slate-100" />
            )}
            <div className="p-3 text-left">
                <p className="text-xs font-bold text-slate-900 truncate">{metadata.title}</p>
                {metadata.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{metadata.description}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                    <img src={`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`} alt="" className="w-3 h-3" />
                    <p className="text-[9px] text-indigo-500 truncate">{new URL(url).hostname}</p>
                </div>
            </div>
        </a>
    );
}
