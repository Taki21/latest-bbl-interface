import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useCallback, useEffect, useRef } from "react";
import type { Block, BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView, lightDefaultTheme } from "@blocknote/mantine";

interface EditorProps {
  initialContent?: Block<any, any, any>[];
  editable?: boolean;
  className?: string;
  onChange?: (blocks: Block<any, any, any>[]) => void;
}

export default function Editor({
  initialContent,
  editable = true,
  className,
  onChange,
}: EditorProps) {
  const editor = useCreateBlockNote({
    initialContent,
  });

  const serializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor) return;

    const serialized = JSON.stringify(initialContent ?? []);
    if (serializedRef.current === serialized) {
      return;
    }
    serializedRef.current = serialized;

    let stopped = false;
    let rafId: number = 0;

    const applyContent = () => {
      if (stopped) return;
      if (!editor.domElement) {
        rafId = requestAnimationFrame(applyContent);
        return;
      }
      if (initialContent && initialContent.length) {
        editor.replaceBlocks(editor.topLevelBlocks, initialContent);
      } else {
        editor.replaceBlocks(editor.topLevelBlocks, []);
      }
    };

    rafId = requestAnimationFrame(applyContent);

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [editor, initialContent]);

  const handleChange = useCallback(
    (instance: BlockNoteEditor<any, any, any>) => {
      if (!onChange) return;
      onChange(instance.document);
    },
    [onChange]
  );

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      className={className}
      theme={lightDefaultTheme}
      onChange={handleChange}
    />
  );
}
