// components/Editor.tsx
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("./EditorInner"), { ssr: false });
export default Editor;
