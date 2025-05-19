import type React from "react"

interface EditorProps {
  content: string
  onChange: (content: string) => void
}

export const Editor: React.FC<EditorProps> = ({ content, onChange }) => {
  return (
    <textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[100px] border border-gray-300 rounded p-2"
    />
  )
}

