import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuItem, DropdownTrigger, DropdownContent } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const members = [
    { name: 'BBL Admin', email: 'admin@example.com', role: 'Owner' },
    { name: 'Professor', email: 'prof@example.com', role: 'Professor' },
    { name: 'Team Leader', email: 'tl@example.com', role: 'Team Leader' },
];

export default function TeamMembers() {
    const [teamMembers, setTeamMembers] = useState(members);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Contact your team members.</CardDescription>
            </CardHeader>
            <CardContent>
                {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                            <Avatar>
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="font-bold">{member.name}</h1>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
