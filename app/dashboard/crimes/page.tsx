"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Crime {
    crimeId: number;
    title: string;
    crimeType: string;
    status: string;
    dateOccurred: string;
}

export default function CrimesPage() {
    const router = useRouter();
    const [crimes, setCrimes] = useState<Crime[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCrimes() {
            try {
                const response = await fetch("/api/crimes");
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to fetch crimes");
                }
                const data = await response.json();
                setCrimes(data);
            } catch (error) {
                console.error("Error fetching crimes:", error);
                setError(error.message);
            }
        }
        fetchCrimes();
    }, []);

    const handleViewDetails = (crimeId: number) => {
        router.push(`/dashboard/crimes/${crimeId}`);
    };

    const stats = {
        total: crimes.length,
        closed: crimes.filter((crime) => crime.status === "Closed").length,
        pending: crimes.filter((crime) => crime.status === "Pending").length,
        investigation: crimes.filter((crime) => crime.status === "Investigation").length,
    };

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    if (crimes.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Crimes</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Crimes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Closed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{stats.closed}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{stats.pending}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Under Investigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{stats.investigation}</p>
                    </CardContent>
                </Card>
            </div>
            <Separator className="my-6" />
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Title</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Date Occurred</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {crimes.map((crime) => (
                            <tr key={crime.crimeId} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">{crime.crimeId}</td>
                                <td className="border border-gray-300 px-4 py-2">{crime.title}</td>
                                <td className="border border-gray-300 px-4 py-2">{crime.crimeType}</td>
                                <td className="border border-gray-300 px-4 py-2">{crime.status}</td>
                                <td className="border border-gray-300 px-4 py-2">
                                    {new Date(crime.dateOccurred).toLocaleDateString()}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                    <Button onClick={() => handleViewDetails(crime.crimeId)}>
                                        View Details
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
