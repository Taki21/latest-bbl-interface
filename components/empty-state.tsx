import { ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onCreateTask: () => void
}

export function EmptyState({ onCreateTask }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">No tasks yet</h2>
      <p className="text-muted-foreground mb-4">Get started by creating your first task</p>
      <Button onClick={onCreateTask}>Create Your First Task</Button>
    </div>
  )
}

