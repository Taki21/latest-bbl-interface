import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Award, Settings } from 'lucide-react'

export default function WelcomePage({ setGetStarted }) {
  return (
    <Card className="w-full max-w-[600px]">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Welcome to CommPutation!</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center mb-4 -mt-4">Empowering campus communities through innovative technology.</p>
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-primary/10 rounded-full mr-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <p>
                Support university/college campus organizations to build long-term communities.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-primary/10 rounded-full mr-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <p>
                Create reputation tokens to reward contributions of members and track their reputation.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-2 bg-primary/10 rounded-full mr-4">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <p>
                Create and customize tasks, activities, and token reward mechanisms.
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => setGetStarted(true)} className="w-full py-6 text-md">Get Started</Button>
      </CardFooter>
    </Card>
  )
}

