"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CrimeDetailsPage() {
    const { crimeId } = useParams();
    const [crime, setCrime] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCrimeDetails() {
            try {
                const response = await fetch(`/api/crime/${crimeId}`);
                if (!response.ok) throw new Error("Failed to fetch crime details");
                const data = await response.json();
                setCrime(data);
            } catch (error) {
                console.error("Error fetching crime details:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCrimeDetails();
    }, [crimeId]);

    if (loading) return <p>Loading...</p>;
    if (!crime) return <p>Crime not found</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Crime Details</h1>
            <p><strong>Title:</strong> {crime.title}</p>
            <p><strong>Status:</strong> {crime.status}</p>
            <p><strong>Reported By:</strong> {crime.reportedBy.name}</p>
            <p><strong>Administrative:</strong> {crime.administrative.user.firstName} {crime.administrative.user.lastName}</p>
            <p><strong>Victim:</strong> {crime.victim.name}</p>
            <p><strong>Accused:</strong> {crime.accused.name}</p>
            <p><strong>Evidence:</strong> {crime.evidence.description}</p>
        </div>
    );
}
