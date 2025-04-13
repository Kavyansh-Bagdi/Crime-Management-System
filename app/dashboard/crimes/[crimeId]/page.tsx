'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CrimeDetailsPage() {
    const { data: session } = useSession();
    const rawParams = useParams();
    const crimeId = Array.isArray(rawParams.crimeId) ? rawParams.crimeId[0] : rawParams.crimeId;

    const [crime, setCrime] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<any>({
        title: "",
        crimeType: "",
        status: "",
        description: "",
        dateOccurred: "",
        location: { city: "", state: "", country: "" },
    });
    const [newEvidence, setNewEvidence] = useState({ evidenceType: "", description: "", img: null });
    const [evidenceList, setEvidenceList] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    const role = session?.user?.role || "User";

    useEffect(() => {
        async function fetchCrimeDetails() {
            if (!crimeId) return;

            try {
                const response = await fetch(`/api/crimes/${crimeId}`);
                if (!response.ok) throw new Error("Failed to fetch crime details");
                const data = await response.json();
                setCrime(data);
                setFormData({
                    title: data.title || "",
                    crimeType: data.crimeType || "",
                    status: data.status || "",
                    description: data.description || "",
                    dateOccurred: data.dateOccurred
                        ? new Date(data.dateOccurred).toISOString().slice(0, 16) // Format for datetime-local
                        : "",
                    location: {
                        city: data.location?.city || "",
                        state: data.location?.state || "",
                        country: data.location?.country || "",
                    },
                });
                setEvidenceList(data.Evidence || []);
            } catch (error) {
                console.error("Error fetching crime details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCrimeDetails();
    }, [crimeId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setCurrentFile(e.target.files[0]);
        } else {
            setCurrentFile(null);
        }
    };

    const handleEvidenceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewEvidence((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddEvidence = async () => {
        if (!currentFile) {
            toast.error("Please upload a valid file.");
            return;
        }

        try {
            const base64 = await fileToBase64(currentFile);
            const updatedEvidence = { ...newEvidence, img: base64 };
            const response = await fetch(`/api/crimes/${crimeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    updates: {
                        evidence: [updatedEvidence],
                        caseLog: {
                            message: `Evidence added by ${session?.user?.name || "Unknown User"}`,
                            userId: session?.user?.id,
                        },
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add evidence");
            }

            toast.success("Evidence added successfully");
            setEvidenceList([...evidenceList, updatedEvidence]);
            resetEvidenceForm();
        } catch (error: any) {
            toast.error(error.message || "Failed to process the file. Please try again.");
        }
    };

    const handleUpdateCrime = async () => {
        try {
            const response = await fetch(`/api/crimes/${crimeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    updates: {
                        ...formData,
                        caseLog: {
                            message: `Crime details updated by ${session?.user?.name || "Unknown User"}`,
                            userId: session?.user?.id,
                        },
                    },
                }),
            });

            if (!response.ok) throw new Error("Failed to update crime details");
            toast.success("Crime details updated successfully");
        } catch (error) {
            toast.error("Failed to update crime details. Please try again.");
        }
    };

    const resetEvidenceForm = () => {
        setDialogOpen(false);
        setNewEvidence({ evidenceType: "", description: "", img: null });
        setCurrentFile(null);
    };

    if (loading) return <p className="p-6">Loading...</p>;
    if (!crime) return <p className="p-6 text-red-500">Crime not found</p>;

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Crime Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <label className="block font-bold mb-2">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Type</label>
                            <Input
                                value={formData.crimeType}
                                onChange={(e) => setFormData({ ...formData, crimeType: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Status</label>
                            <Input
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Description</label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Date Occurred</label>
                            <Input
                                type="datetime-local"
                                value={formData.dateOccurred}
                                onChange={(e) => setFormData({ ...formData, dateOccurred: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Location</label>
                            <Input
                                placeholder="City"
                                value={formData.location.city}
                                onChange={(e) =>
                                    setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })
                                }
                                className="mb-2"
                            />
                            <Input
                                placeholder="State"
                                value={formData.location.state}
                                onChange={(e) =>
                                    setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })
                                }
                                className="mb-2"
                            />
                            <Input
                                placeholder="Country"
                                value={formData.location.country}
                                onChange={(e) =>
                                    setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })
                                }
                            />
                        </div>
                        {(role === "Admin" || role === "Administrative") && (
                            <Button onClick={handleUpdateCrime}>Update Crime</Button>
                        )}
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Submitted At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {evidenceList.map((evidence, index) => (
                                <TableRow key={index}>
                                    <TableCell>{evidence.description}</TableCell>
                                    <TableCell>{evidence.submittedAt ? new Date(evidence.submittedAt).toLocaleString() : "N/A"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {(role === "Admin" || role === "Administrative") && (
                        <div className="mt-4 space-y-2">
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button">Add Evidence</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Evidence</DialogTitle>
                                        <DialogDescription>Fill in the evidence details below.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <label>Evidence Type</label>
                                        <Input
                                            name="evidenceType"
                                            placeholder="E.g., Photo, Video, Document"
                                            value={newEvidence.evidenceType}
                                            onChange={handleEvidenceDetailsChange}
                                        />
                                        <label>Description</label>
                                        <Textarea
                                            name="description"
                                            placeholder="Enter a description for this evidence"
                                            value={newEvidence.description}
                                            onChange={handleEvidenceDetailsChange}
                                        />
                                        <label>Upload Image</label>
                                        <Input type="file" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                    <DialogFooter className="mt-4 space-x-2">
                                        <Button onClick={handleAddEvidence}>Add Evidence</Button>
                                        <Button onClick={resetEvidenceForm} variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Case Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside">
                        {crime.crimeLogs.map((log: any) => (
                            <li key={log.logId}>
                                <strong>{new Date(log.updatedAt).toLocaleString()}:</strong> {log.update} (by {log.user.firstName} {log.user.lastName})
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper function: converts a File object to a base64 string
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
}
