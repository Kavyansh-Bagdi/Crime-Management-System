"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AnalyticsData = {
    userCount: number;
    crimeCount: number;
    evidenceCount: number;
    crimesByStatus: { status: string; _count: { _all: number } }[];
    latestFIRs: {
        crimeId: number;
        title: string;
        crimeType: string;
        status: string;
        dateOccurred: string;
        createdAt: string;
        location: {
            city: string;
            state: string;
            country: string;
        };
    }[];
};

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/analytics")
            .then((res) => res.json())
            .then((d) => {
                setData(d);
                setLoading(false);
            });
    }, []);

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl">{data?.userCount}</span>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Crimes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl">{data?.crimeCount}</span>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Evidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl">{data?.evidenceCount}</span>}
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Crimes by Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={data?.crimesByStatus.map((item) => ({
                                    status: item.status,
                                    count: item._count._all,
                                }))}
                            >
                                <XAxis dataKey="status" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Latest FIRs</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-32 w-full" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date Occurred</TableHead>
                                    <TableHead>Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.latestFIRs.map((fir) => (
                                    <TableRow key={fir.crimeId}>
                                        <TableCell>{fir.title}</TableCell>
                                        <TableCell>{fir.crimeType}</TableCell>
                                        <TableCell>{fir.status}</TableCell>
                                        <TableCell>{new Date(fir.dateOccurred).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            {fir.location.city}, {fir.location.state}, {fir.location.country}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
