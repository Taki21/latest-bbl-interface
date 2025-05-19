"use client";

import { Separator } from "@/components/ui/separator";
import CurrentTasks from "./CurrentTasks";
import DashboardInfo from "./DashboardInfo";

const Dashboard = () => {
  return (
    <div className="flex flex-col justify-between gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">At A Glance</h1>
          <p className="text-sm text-muted-foreground">Brief information about your tasks and team.</p>
        </div>
        <DashboardInfo />
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight">Your Tasks</h1>
          <p className="text-sm text-muted-foreground">View current tasks assigned to you.</p>
        </div>
        <CurrentTasks />
        <div />
      </div>
      
    </div>
  );
}

export default Dashboard;