"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CrimePage() {
    const [crimes, setCrimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchCrimes() {
            try {
                const response = await fetch("/api/crime");
                if (!response.ok) throw new Error("Failed to fetch crimes");
                const data = await response.json();
                setCrimes(data);
            } catch (error) {
                console.error("Error fetching crimes:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCrimes();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Crime Records</h1>
            <ul>
                {crimes.map((crime) => (
                    <li key={crime.crimeId} className="mb-4">
                        <p><strong>Title:</strong> {crime.title}</p>
                        <p><strong>Status:</strong> {crime.status}</p>
                        <Button onClick={() => router.push(`/crime/${crime.crimeId}`)}>
                            View Details
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
