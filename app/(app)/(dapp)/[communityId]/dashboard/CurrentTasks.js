"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EllipsisVerticalIcon } from "lucide-react";

const CurrentTasks = () => {

    function TaskCard() {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Avatar>
                                <AvatarFallback>AB</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-md">BBL Admin</h1>
                                <h1 className="text-xs text-muted-foreground">Today 4:20 PM</h1>
                            </div>
                        </div>
                        <EllipsisVerticalIcon size={16} />
                    </div>
                </CardHeader>
                <CardContent>
                    <h1 className="text-lg">Task Title</h1>
                    <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla nec purus feugiat, molestie ipsum et, consequat nunc. Nulla facilisi. Nullam nec nunc nec nunc.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((task) => (
                    <TaskCard key={task} />
                ))}
            </div>
        </div>
    );
}

export default CurrentTasks;