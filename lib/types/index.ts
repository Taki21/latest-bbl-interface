// User type definition
export interface User {
    id: string;
    name: string;
    email: string;
    balance: BigInt;
    tasks: Task[];
    projects: Project[];
    communities: Community[];
    createdAt?: string;
    updatedAt?: string;
}

// Member type definition
export interface Member {
    user: User;
    communityId: string;
    balance: BigInt;
    role: "Owner" | "Supervisor" | "Project Manager" | "Default";
}

// Task type definition
export interface Task {
    id?: string;
    name: string;
    description: string;
    status: "not-started" | "in-progress" | "under-review" | "completed";
    priority: "low" | "medium" | "high";
    balance: BigInt;
    deadline: string;
    member: Member[];
    creator: Member;
    createdAt?: string;
    updatedAt?: string;
}

// Project type definition
export interface Project {
    id?: string;
    title: string;
    description: string;
    balance: BigInt;
    teamLeader: Member;
    deadline: string;
    status: "active" | "completed" | "on-hold";
    creator: Member;
    members: Member[];
    tasks: Task[];
    createdAt?: string;
    updatedAt?: string;
}

// Allocation type definition
export interface Allocation {
    member: Member;
    amount: BigInt;
}

// Community type definition
export interface Community {
    id?: string;
    joinCode?: string;
    name: string;
    description: string;
    affiliation: string;
    creator: User;
    newMemberReward: number;
    referralReward: number;
    tokenAddress?: string;
    tokenName: string;
    tokenSymbol: string;
    balance: BigInt;
    members: Member[];
    projects: Project[];
    allocations: Allocation[];
    createdAt?: string;
    updatedAt?: string;
}
