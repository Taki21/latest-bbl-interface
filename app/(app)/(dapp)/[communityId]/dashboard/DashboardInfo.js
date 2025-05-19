"use client";

import { Calendar } from "@/components/ui/calendar";
import TeamMembers from "./TeamMembers";
import { Card } from "@/components/ui/card";
import BalanceCard from "./BalanceCard";

const DashboardInfo = () => {
    return (
        <div className="flex gap-2 ">
            <BalanceCard/>
            <div className="w-full">
                <TeamMembers/>
            </div>
            <Card>
                <Calendar />
            </Card>
            
        </div>
    );
}

export default DashboardInfo;