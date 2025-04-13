"use client"

import CrimeReportForm from "@/components/crime/report-crime"
import MaintenanceError from "@/app/maintenance-error"; // Import MaintenanceError
import { useState, useEffect } from "react";

export default function ReportPage() {
    const [isUnderMaintenance, setIsUnderMaintenance] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkMaintenance() {
            try {
                const response = await fetch("/api/report/maintenance");
                const data = await response.json();
                setIsUnderMaintenance(data.isUnderMaintenance);
            } catch (error) {
                setIsUnderMaintenance(false);
            }
        }
        checkMaintenance();
    }, []);

    if (isUnderMaintenance === null) return <div>Loading...</div>;
    if (isUnderMaintenance) return <MaintenanceError />; // Render MaintenanceError if under maintenance

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <CrimeReportForm />
                </div>
            </div>
        </div>
    );
}
