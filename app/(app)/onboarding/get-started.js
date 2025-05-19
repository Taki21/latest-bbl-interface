import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { CreateCommunityDialog } from '@/components/create-community-dialog'
import { JoinCommunityDialog } from '@/components/join-community-dialog'

export default function GetStartedPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)

  return (
    <Card className="w-full max-w-[800px]">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Get Started</CardTitle>
      </CardHeader>
      <CardContent className="p-6 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button variant="outline" className="h-full" onClick={() => setCreateDialogOpen(true)}>
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <PlusCircle className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Create Community</h3>
                <p className="text-sm text-muted-foreground">Start a community for your campus organization.</p>
              </div>
            </div>
          </Button>
          <Button variant="outline" className="h-full" onClick={() => setJoinDialogOpen(true)}>
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <UserPlus className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Join Community</h3>
                <p className="text-sm text-muted-foreground">Connect with an existing campus community.</p>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
      <CreateCommunityDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <JoinCommunityDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />
    </Card>
  )
}

