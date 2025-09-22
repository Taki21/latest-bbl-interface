"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { Block } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from "@blocknote/mantine";

interface EditorProps {
    initialContent?: Block[];
    editable?: boolean;
    className?: string;
    onChange?: (blocks: Block[]) => void;
}

export default function EditorInner({
    initialContent,
    editable = true,
    className,
    onChange,
}: EditorProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const normalizedInitial = useMemo(() => {
        const list = initialContent ?? [];
        return Array.isArray(list) && list.length > 0
            ? list
            : ([{ type: "paragraph", content: [] }] as unknown as Block[]);
    }, [initialContent]);
    const editor = useCreateBlockNote({ initialContent: normalizedInitial });

    // Guard: don't render until the editor instance exists on client
    if (!mounted || !editor) return null;

    return (
        <BlockNoteView
            editor={editor}
            editable={editable}
            theme={
                theme === "dark"
                    ? {
                        ...darkDefaultTheme,
                        colors: {
                            ...darkDefaultTheme.colors,
                            editor: {
                                ...darkDefaultTheme.colors.editor,
                                background: "#0A0A0A", // pure black
                            },
                        },
                    }
                    : lightDefaultTheme
            }
            onChange={(ed) => onChange?.(ed.document)}
        />
    );
}
