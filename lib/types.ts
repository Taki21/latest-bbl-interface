export interface User {
  id: string
  name: string
  email: string
  tasksCompleted: number
  balance: number
  role: "Owner" | "Professor" | "Team Leader" | "Member"
  createdAt?: string
  updatedAt?: string
}

export interface Task {
  id: string
  name: string
  description: string
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  balance: string
  deadline: string
  users: string[]
  creator: string

  createdAt?: string
  updatedAt?: string
}

export interface Project {
  id: string
  title: string
  description: string
  balance: number
  teamLeader: string
  teamCoLeaders: string[]
  deadline: string
  status: "active" | "completed" | "on-hold"

  createdAt?: string
  updatedAt?: string
}

export interface Organization {
  id: string
  name: string
  description: string
  affiliation: string
  admin: string
  
  numberOfMembers: number
  numberOfProjects: number
  numberOfTasks: number

  newMemberReward: number
  referralReward: number

  tokenAddress: string
  tokenName: string
  tokenSymbol: string

  createdAt?: string
  updatedAt?: string
}