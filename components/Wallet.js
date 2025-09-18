import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useEffect, useState } from "react"
import { useDisconnect, useWalletClient } from "wagmi"
import { usePrivy } from "@privy-io/react-auth"

export default function WalletButton() {

    const { disconnect } = useDisconnect();
    const { data: walletClient } = useWalletClient();
    const { logout, user: privyUser } = usePrivy();

    const [user, setUser] = useState({
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    });

    useEffect(() => {
        if (privyUser) {
            setUser({
                name: privyUser.name ?? privyUser?.google?.name ?? "User",
                email: privyUser.email ?? privyUser?.google?.email ?? "",
                avatar: privyUser.profilePictureUrl ?? privyUser?.google?.picture ?? "/avatars/shadcn.jpg",
            });
        }
    }, [privyUser, walletClient]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt="@shadcn" />
                        <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        Profile
                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Billing
                        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Settings
                        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>New Team</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { disconnect(); logout(); }}>
                    <LogOut />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}