"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useEffect, useRef } from "react";
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
    const editor = useCreateBlockNote({ initialContent });

    // optional: re-apply when prop changes
    const last = useRef<string | null>(null);
    useEffect(() => {
        if (!editor) return;
        const serialized = JSON.stringify(initialContent ?? []);
        if (last.current === serialized) return;
        last.current = serialized;

        requestAnimationFrame(() => {
            editor.replaceBlocks(
                editor.document,
                initialContent?.length ? initialContent : []
            );
        });
    }, [editor, initialContent]);

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
