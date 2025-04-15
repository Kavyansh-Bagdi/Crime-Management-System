'use client';

import {
    IconTrash
} from "@tabler/icons-react"

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const UserSearchInput = ({
    label,
    query,
    setQuery,
    suggestions,
    onSelect,
}: {
    label: string;
    query: string;
    setQuery: (value: string) => void;
    suggestions: any[];
    onSelect: (user: { userId: number; firstName: string, lastName: string, email: string, phoneNumber: string }) => void;
}) => (
    <div className="grid gap-2 relative">
        <Label>{label}</Label>
        <Input
            placeholder={`Search for ${label.toLowerCase()} by name or email`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
        />
        {suggestions.length > 0 && (
            <ul className="absolute z-10 top-full mt-1 w-full bg-accent border rounded shadow">
                {suggestions.map((user) => (
                    <li
                        key={user.userId}
                        className="px-3 py-2 hover:bg-background cursor-pointer text-sm"
                        onClick={() =>
                            onSelect({
                                userId: user.userId,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phoneNumber: user.phoneNumber,
                            })
                        }
                    >
                        {user.firstName} {user.lastName} — {user.email}
                    </li>
                ))}
            </ul>
        )}
    </div>
);

export default function CrimeDetailsPage() {
    const { data: session } = useSession();
    const isCivilian = (session?.user?.role || "") == "Civilian";
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
        accused: [],
        victims: [],
        administrative: null,
    });
    const [newEvidence, setNewEvidence] = useState({ title: "", description: "", img: null });
    const [evidenceList, setEvidenceList] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [editingEvidenceIndex, setEditingEvidenceIndex] = useState<number | null>(null);
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState(""); // State for search input

    const [accusedQuery, setAccusedQuery] = useState("");
    const [accusedSuggestions, setAccusedSuggestions] = useState<any[]>([]);
    const [victimQuery, setVictimQuery] = useState("");
    const [victimSuggestions, setVictimSuggestions] = useState<any[]>([]);
    const [administrativeQuery, setAdministrativeQuery] = useState("");
    const [administrativeSuggestions, setAdministrativeSuggestions] = useState<any[]>([]);

    const role = session?.user?.role || "User";

    const [dateOccurred, setDateOccurred] = useState<Date | undefined>(
        formData.dateOccurred ? new Date(formData.dateOccurred) : undefined
    );

    useEffect(() => {
        async function fetchCrimeDetails() {
            if (!crimeId) return;

            try {
                const [crimeResponse, evidenceResponse] = await Promise.all([
                    fetch(`/api/crimes/${crimeId}`),
                    fetch(`/api/evidence?crimeId=${crimeId}`),
                ]);

                if (!crimeResponse.ok || !evidenceResponse.ok) {
                    throw new Error("Failed to fetch crime or evidence details");
                }

                const crimeData = await crimeResponse.json();
                const evidenceData = await evidenceResponse.json();

                setCrime(crimeData);
                setFormData({
                    title: crimeData.title || "",
                    crimeType: crimeData.crimeType || "",
                    status: crimeData.status || "",
                    description: crimeData.description || "",
                    dateOccurred: crimeData.dateOccurred
                        ? new Date(crimeData.dateOccurred).toISOString().slice(0, 16)
                        : "",
                    location: {
                        city: crimeData.location?.city || "",
                        state: crimeData.location?.state || "",
                        country: crimeData.location?.country || "",
                    },
                    accused: crimeData.accused || [],
                    victims: crimeData.victim || [], // Map 'victim' key to 'victims'
                    administrative: crimeData.administrative || null, // Include administrative field
                });

                // Ensure the date is set in the `dateOccurred` state
                setDateOccurred(crimeData.dateOccurred ? new Date(crimeData.dateOccurred) : undefined);

                setEvidenceList(evidenceData || []);
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

    const handleAddOrUpdateEvidence = async () => {
        try {
            const evidenceUpdates = [];

            // If editing existing evidence, only update allowed fields
            if (editingEvidenceIndex !== null) {
                evidenceUpdates.push({
                    evidenceId: evidenceList[editingEvidenceIndex].evidenceId,
                    title: newEvidence.title,
                    description: newEvidence.description,
                    mime: newEvidence.mime || evidenceList[editingEvidenceIndex].mime,
                    filename: newEvidence.filename || evidenceList[editingEvidenceIndex].filename,
                    submitedBy: session?.user?.id, // Updated field
                });
            } else {
                // If adding new evidence, include the image
                const base64 = currentFile ? await fileToBase64(currentFile) : null;
                evidenceUpdates.push({
                    title: newEvidence.title,
                    description: newEvidence.description,
                    img: base64,
                    mime: currentFile?.type || "image/jpeg",
                    filename: currentFile?.name || "evidence.jpg",
                    submitedBy: session?.user?.id, // Updated field
                });
            }

            const response = await fetch(`/api/crimes/${crimeId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    evidenceUpdates,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add/update evidence");
            }

            toast.success(`Evidence ${editingEvidenceIndex !== null ? "updated" : "added"} successfully`);

            // Refresh evidence list
            const updatedEvidenceList = await fetch(`/api/evidence?crimeId=${crimeId}`).then((res) => res.json());
            setEvidenceList(updatedEvidenceList);

            resetEvidenceForm();
        } catch (error: any) {
            toast.error(error.message || "Failed to process the file. Please try again.");
        }
    };

    const handleDeleteEvidence = async (evidenceId: number) => {
        try {
            const response = await fetch(`/api/crimes/${crimeId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deleteEvidenceIds: [evidenceId],
                }),
            });

            if (!response.ok) throw new Error("Failed to delete evidence");

            setEvidenceList((prev) => prev.filter((ev) => ev.evidenceId !== evidenceId));
            toast.success("Evidence deleted successfully");
        } catch (error) {
            toast.error("Failed to delete evidence. Please try again.");
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
                        dateOccurred: dateOccurred?.toISOString(),
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
        setNewEvidence({ title: "", description: "", img: null });
        setCurrentFile(null);
        setEditingEvidenceIndex(null);
    };

    const fetchAdministrativeSuggestions = async (query: string) => {
        if (query.length < 2) return setAdministrativeSuggestions([]);
        try {
            const response = await fetch(`/api/administrative/query?query=${query}`);
            if (!response.ok) throw new Error("Failed to fetch administrative suggestions");
            const data = await response.json();
            setAdministrativeSuggestions(data.slice(0, 5));
        } catch (error) {
            console.error("Error fetching administrative suggestions:", error);
            setAdministrativeSuggestions([]);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => fetchAdministrativeSuggestions(administrativeQuery), 300);
        return () => clearTimeout(timeout);
    }, [administrativeQuery]);

    const handleAssignAdministrative = (user: any) => {
        setFormData((prev) => ({
            ...prev,
            administrative: user,
        }));
        setAdministrativeQuery("");
        setAdministrativeSuggestions([]);
        toast.success(`Assigned ${user.firstName} ${user.lastName} as administrative.`);
    };

    const fetchUserSuggestions = async (query: string, setSuggestions: (val: any[]) => void) => {
        if (query.length < 2) return setSuggestions([]);
        try {
            const res = await fetch(`/api/users?query=${query}`);
            const data = await res.json();
            setSuggestions(data.slice(0, 5));
        } catch (err) {
            console.error("User fetch error:", err);
            setSuggestions([]);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => fetchUserSuggestions(accusedQuery, setAccusedSuggestions), 300);
        return () => clearTimeout(timeout);
    }, [accusedQuery]);

    useEffect(() => {
        const timeout = setTimeout(() => fetchUserSuggestions(victimQuery, setVictimSuggestions), 300);
        return () => clearTimeout(timeout);
    }, [victimQuery]);

    const handleAddUser = (user: { id?: number; userId?: number; name?: string; firstName?: string; lastName?: string; email?: string; phoneNumber?: string }, type: "accused" | "victims") => {

        if (formData[type].some((u: any) => u.userId === user.userId)) return;

        setFormData((prev) => {
            const updatedData = {
                ...prev,
                [type]: [...prev[type], user],
            };
            console.log(updatedData.accused, updatedData.victims);
            return updatedData;
        });

        if (type === "accused") {
            setAccusedQuery("");
            setAccusedSuggestions([]);
        } else {
            setVictimQuery("");
            setVictimSuggestions([]);
        }
    };

    const handleRemoveUser = (userId: string, type: "accused" | "victims") => {
        setFormData((prev) => ({
            ...prev,
            [type]: prev[type].filter((user: any) => user.userId !== userId),
        }));
    };

    if (loading) return <p className="p-6">Loading...</p>;
    if (!crime) return <p className="p-6 text-red-500">Crime not found</p>;

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className='text-4xl'>{formData.title}</CardTitle>
                    <CardDescription>{formData.location.city}, {formData.location.state}, {formData.location.country}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className='flex w-full justify-evenly gap-4'>
                            <div className='flex-1'>
                                <label className="block font-bold mb-2">Type</label>
                                <Select
                                    disabled={isCivilian}
                                    value={formData.crimeType} // Default value from API
                                    onValueChange={(value) => setFormData({ ...formData, crimeType: value })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={formData.crimeType || "Select Crime Type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Burglary">Burglary</SelectItem>
                                        <SelectItem value="Assault">Assault</SelectItem>
                                        <SelectItem value="Fraud">Fraud</SelectItem>
                                        <SelectItem value="Robbery">Robbery</SelectItem>
                                        <SelectItem value="Arson">Arson</SelectItem>
                                        <SelectItem value="Theft">Theft</SelectItem>
                                        <SelectItem value="Vandalism">Vandalism</SelectItem>
                                        <SelectItem value="Homicide">Homicide</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className='flex-1'>
                                <label className="block font-bold mb-2">Status</label>
                                <Select
                                    disabled={isCivilian}
                                    value={formData.status} // Default value from API
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={formData.status || "Select Status"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Accepted">Accepted</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                        <SelectItem value="Reported">Reported</SelectItem>
                                        <SelectItem value="Investigation">Investigation</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className='flex-1'>
                                <label className="block font-bold mb-2">Date Occurred</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dateOccurred && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateOccurred ? format(dateOccurred, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dateOccurred}
                                            onSelect={(date) => {
                                                setDateOccurred(date);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    dateOccurred: date ? date.toISOString().slice(0, 16) : "",
                                                }));
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div>
                            <label className="block font-bold mb-2">Description</label>
                            <Textarea
                                disabled={isCivilian}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block font-bold mb-2">Accused</label>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {formData.accused.map((accused: any) => (
                                        <Card key={accused.userId} className="p-4">
                                            <CardContent>
                                                <p>{`${accused.firstName} ${accused.lastName || ""}`.trim()}</p>
                                                <p>Email: {accused.email || "N/A"}</p>
                                                <p>Phone: {accused.phoneNumber || "N/A"}</p>
                                                {(role === "Admin" || role === "Administrative") && (
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleRemoveUser(accused.userId, "accused")}
                                                        >
                                                            <IconTrash size={18} stroke={2} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <div>
                                    {role === "Admin" || role === "Administrative" ? (
                                        <div className="space-y-4">
                                            <UserSearchInput
                                                label="Accused"
                                                query={accusedQuery}
                                                setQuery={setAccusedQuery}
                                                suggestions={accusedSuggestions}
                                                onSelect={(user) => handleAddUser(user, "accused")}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold mb-2">Victims</label>
                            <div className="space-y-4">

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {formData.victims.map((victim: any) => (
                                        <Card key={victim.userId} className="p-4">
                                            <CardContent>
                                                <p>{`${victim.firstName} ${victim.lastName || ""}`.trim()}</p>
                                                <p>Email: {victim.email || "N/A"}</p>
                                                <p>Phone: {victim.phoneNumber || "N/A"}</p>
                                                {(role === "Admin" || role === "Administrative") && (
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleRemoveUser(victim.userId, "victims")}
                                                        >
                                                            <IconTrash size={18} stroke={2} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <div>
                                    {role === "Admin" || role === "Administrative" ? (
                                        <div className="space-y-4">
                                            <UserSearchInput
                                                label="Victim"
                                                query={victimQuery}
                                                setQuery={setVictimQuery}
                                                suggestions={victimSuggestions}
                                                onSelect={(user) => handleAddUser(user, "victims")}
                                            />
                                        </div>
                                    ) : null}

                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold mb-2">Administrative</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {formData.administrative ? (
                                    <Card className="p-4">
                                        <CardContent>
                                            <p className="font-bold text-lg">{`${formData.administrative.firstName} ${formData.administrative.lastName || ""}`.trim()}</p>
                                            <p className="text-sm text-gray-600">Email: <span className="text-gray-800">{formData.administrative.email || "N/A"}</span></p>
                                            <p className="text-sm text-gray-600">Phone: <span className="text-gray-800">{formData.administrative.phoneNumber || "N/A"}</span></p>
                                            {formData.administrative.administrative && (
                                                <>
                                                    <p className="text-sm text-gray-600">Designation: <span className="text-gray-800">{formData.administrative.administrative.designation || "N/A"}</span></p>
                                                    <p className="text-sm text-gray-600">Badge Number: <span className="text-gray-800">{formData.administrative.administrative.badgeNumber || "N/A"}</span></p>
                                                    <p className="text-sm text-gray-600">Department: <span className="text-gray-800">{formData.administrative.administrative.department || "N/A"}</span></p>
                                                </>
                                            )}
                                            {role === "Admin" && (
                                                <div className="flex justify-end mt-4">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, administrative: null }));
                                                            toast.success("Administrative officer removed");
                                                        }}
                                                    >
                                                        <IconTrash size={18} stroke={2} />
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div>
                                        {role === "Admin" && (
                                            <div className="space-y-4">
                                                <UserSearchInput
                                                    label="Administrative Officer"
                                                    query={administrativeQuery}
                                                    setQuery={setAdministrativeQuery}
                                                    suggestions={administrativeSuggestions}
                                                    onSelect={handleAssignAdministrative}
                                                />
                                            </div>
                                        )}
                                        {role !== "Admin" && (
                                            <p>No administrative officer is assigned to this case.</p>
                                        )}
                                    </div>
                                )}
                            </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {evidenceList.map((evidence) => (
                            <div key={evidence.evidenceId} className="relative group">
                                <AspectRatio ratio={1} className="overflow-hidden rounded-lg shadow-md">
                                    <img
                                        src={`data:${evidence.mime};base64,${evidence.img}`}
                                        alt="Evidence"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => setSelectedEvidence(evidence)}
                                    />
                                </AspectRatio>
                                <div className="mt-2 text-center">
                                    <p className="font-bold">{evidence.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Evidence Button */}
                    {(role === "Admin" || role === "Administrative") && (
                        <div className="mt-4">
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>{editingEvidenceIndex !== null ? "Edit Evidence" : "Add Evidence"}</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingEvidenceIndex !== null ? "Edit Evidence" : "Add Evidence"}</DialogTitle>
                                        <DialogDescription>
                                            {editingEvidenceIndex !== null
                                                ? "Update the details of the evidence."
                                                : "Fill in the details below to add new evidence."}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Input
                                            disabled={isCivilian}
                                            name="title"
                                            placeholder="Evidence Type"
                                            value={newEvidence.title}
                                            onChange={handleEvidenceDetailsChange}
                                        />
                                        <Textarea
                                            name="description"
                                            placeholder="Description"
                                            value={newEvidence.description}
                                            onChange={handleEvidenceDetailsChange}
                                        />
                                        {editingEvidenceIndex === null && (
                                            <Input disabled={isCivilian} type="file" accept="image/*" onChange={handleFileChange} />
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddOrUpdateEvidence}>
                                            {editingEvidenceIndex !== null ? "Update" : "Submit"}
                                        </Button>
                                        <Button variant="outline" onClick={resetEvidenceForm}>
                                            Cancel
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* Dialog for viewing evidence in large form */}
                    {selectedEvidence && (
                        <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>View Evidence</DialogTitle>
                                    <DialogDescription>Details of the selected evidence are shown below.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <img
                                        src={`data:${selectedEvidence.mime};base64,${selectedEvidence.img}`}
                                        alt="Evidence"
                                        className="w-full h-auto rounded-lg"
                                    />
                                    <div>
                                        <Input
                                            disabled={isCivilian}
                                            name="title"
                                            placeholder="Evidence Type"
                                            value={selectedEvidence.title}
                                            onChange={(e) =>
                                                setSelectedEvidence((prev: any) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                }))
                                            }
                                        />
                                        <Textarea
                                            name="description"
                                            placeholder="Description"
                                            value={selectedEvidence.description}
                                            onChange={(e) =>
                                                setSelectedEvidence((prev: any) => ({
                                                    ...prev,
                                                    description: e.target.value,
                                                }))
                                            }
                                            className="mt-4"
                                        />
                                        <Input

                                            readOnly
                                            value={selectedEvidence.filename}
                                            placeholder="Filename"
                                            className="cursor-not-allowed mt-4"
                                        />
                                        <Input
                                            readOnly
                                            value={selectedEvidence.submitedByName || "Unknown User"}
                                            placeholder="Submitted By"
                                            className="cursor-not-allowed mt-4"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`/api/crimes/${crimeId}`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        evidenceUpdates: [
                                                            {
                                                                evidenceId: selectedEvidence.evidenceId,
                                                                title: selectedEvidence.title,
                                                                description: selectedEvidence.description,
                                                            },
                                                        ],
                                                    }),
                                                });

                                                if (!response.ok) {
                                                    const errorData = await response.json();
                                                    throw new Error(errorData.error || "Failed to update evidence");
                                                }

                                                toast.success("Evidence updated successfully");

                                                const updatedEvidenceList = await fetch(`/api/evidence?crimeId=${crimeId}`).then((res) =>
                                                    res.json()
                                                );
                                                setEvidenceList(updatedEvidenceList);
                                                setSelectedEvidence(null);
                                            } catch (error: any) {
                                                toast.error(error.message || "Failed to update evidence. Please try again.");
                                            }
                                        }}
                                    >
                                        Update
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`/api/crimes/${crimeId}`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        deleteEvidenceIds: [selectedEvidence.evidenceId],
                                                    }),
                                                });

                                                if (!response.ok) {
                                                    const errorData = await response.json();
                                                    throw new Error(errorData.error || "Failed to delete evidence");
                                                }

                                                toast.success("Evidence deleted successfully");

                                                // Refresh evidence list
                                                const updatedEvidenceList = await fetch(`/api/evidence?crimeId=${crimeId}`).then((res) =>
                                                    res.json()
                                                );
                                                setEvidenceList(updatedEvidenceList);
                                                setSelectedEvidence(null);
                                            } catch (error: any) {
                                                toast.error(error.message || "Failed to delete evidence. Please try again.");
                                            }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                    <Button variant="outline" onClick={() => setSelectedEvidence(null)}>
                                        Close
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
                                <strong>{new Date(log.updatedAt).toLocaleString()}:</strong> {log.update}(by {log.user.firstName} {log.user.lastName})
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div >
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
