"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog"
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
} from "@/components/ui/context-menu"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"

interface Evidence {
    evidenceType: string
    description: string
    img: string
}

interface Form {
    title: string
    crimeType: string
    description: string
    dateOccurred: string
    accused: { id: string; name: string }[]
    victims: { id: string; name: string }[]
    location: {
        city: string
        state: string
        country: string
    }
    evidence: Evidence[]
}

// Zod schema for form validation
const crimeReportSchema = z.object({
    title: z.string().min(1, "Title is required"),
    crimeType: z.string().min(1, "Crime type is required"),
    description: z.string().optional(),
    dateOccurred: z.string().min(1, "Date occurred is required"),
    accused: z.array(z.object({ id: z.string(), name: z.string() })),
    victims: z.array(z.object({ id: z.string(), name: z.string() })),
    location: z.object({
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        country: z.string().min(1, "Country is required"),
    }),
    evidence: z.array(
        z.object({
            evidenceType: z.string().min(1, "Evidence type is required"),
            description: z.string().optional(),
            img: z.string().min(1, "Evidence image is required"),
        })
    ),
})

interface UserSearchProps {
    label: string
    query: string
    setQuery: (value: string) => void
    suggestions: any[]
    onSelect: (user: { id: string; name: string }) => void
}

const UserSearchInput = ({
    label,
    query,
    setQuery,
    suggestions,
    onSelect,
}: UserSearchProps) => {
    return (
        <div className="grid gap-2 relative">
            <Label>{label}</Label>
            <Input
                placeholder={`Search for ${label.toLowerCase()} by name or email`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {suggestions.length > 0 && (
                <ul className="absolute z-10 top-full mt-1 w-full bg-accent border rounded shadow">
                    {suggestions.map((user, index) => (
                        <li
                            key={user.id ? `${user.id}` : `user-${index}`}
                            className="px-3 py-2 hover:bg-background cursor-pointer text-sm"
                            onClick={() =>
                                onSelect({
                                    id: user.id,
                                    name: `${user.firstName} ${user.lastName || ""} (${user.email})`,
                                })
                            }
                        >
                            {user.firstName} {user.lastName} — {user.email}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

const CrimeReportForm = () => {
    const { data: session } = useSession()
    const router = useRouter()

    const [form, setForm] = useState<Form>({
        title: "",
        crimeType: "",
        description: "",
        dateOccurred: "",
        accused: [],
        victims: [],
        location: {
            city: "",
            state: "",
            country: "",
        },
        evidence: [],
    })

    // Separate states for accused and victim search queries and suggestions
    const [accusedQuery, setAccusedQuery] = useState("")
    const [accusedSuggestions, setAccusedSuggestions] = useState<any[]>([])
    const [victimQuery, setVictimQuery] = useState("")
    const [victimSuggestions, setVictimSuggestions] = useState<any[]>([])

    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newEvidence, setNewEvidence] = useState<Evidence>({
        evidenceType: "",
        description: "",
        img: "",
    })
    const [currentFile, setCurrentFile] = useState<File | null>(null)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)

    // Generic function to fetch user suggestions
    const fetchUserSuggestions = async (
        query: string,
        setSuggestions: (val: any[]) => void
    ) => {
        if (query.length < 2) return setSuggestions([])
        try {
            const res = await fetch(`/api/users?query=${query}`)
            const data = await res.json()
            setSuggestions(data.slice(0, 5))
        } catch (err) {
            console.error("User fetch error:", err)
            setSuggestions([])
        }
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUserSuggestions(accusedQuery, setAccusedSuggestions)
        }, 300)
        return () => clearTimeout(timeout)
    }, [accusedQuery])

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUserSuggestions(victimQuery, setVictimSuggestions)
        }, 300)
        return () => clearTimeout(timeout)
    }, [victimQuery])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name in form.location) {
            setForm((prev) => ({
                ...prev,
                location: { ...prev.location, [name]: value },
            }))
        } else {
            setForm((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setCurrentFile(e.target.files[0])
    }

    const handleEvidenceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setNewEvidence((prev) => ({ ...prev, [name]: value }))
    }

    const handleAddEvidence = async () => {
        if (!currentFile) return
        const base64 = await fileToBase64(currentFile)
        const updatedEvidence = { ...newEvidence, img: base64 }

        setForm((prev) => ({
            ...prev,
            evidence:
                editingIndex !== null
                    ? prev.evidence.map((e, i) => (i === editingIndex ? updatedEvidence : e))
                    : [...prev.evidence, updatedEvidence],
        }))

        setDialogOpen(false)
        setNewEvidence({ evidenceType: "", description: "", img: "" })
        setCurrentFile(null)
        setEditingIndex(null)
    }

    const handleEditEvidence = (index: number) => {
        setNewEvidence(form.evidence[index])
        setEditingIndex(index)
        setDialogOpen(true)
    }

    const handleDeleteEvidence = (index: number) => {
        setForm((prev) => ({
            ...prev,
            evidence: prev.evidence.filter((_, i) => i !== index),
        }))
    }

    const handleAddAccused = (user: { id: string; name: string }) => {
        setForm((prev) => ({
            ...prev,
            accused: [...prev.accused, user],
        }))
        setAccusedQuery("")
        setAccusedSuggestions([])
    }

    const handleAddVictim = (user: { id: string; name: string }) => {
        setForm((prev) => ({
            ...prev,
            victims: [...prev.victims, user],
        }))
        setVictimQuery("")
        setVictimSuggestions([])
    }

    const handleRemoveAccused = (id: string) => {
        setForm((prev) => ({
            ...prev,
            accused: prev.accused.filter((user) => user.id !== id),
        }))
    }

    const handleRemoveVictim = (id: string) => {
        setForm((prev) => ({
            ...prev,
            victims: prev.victims.filter((user) => user.id !== id),
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Validate form data using Zod
        const parseResult = crimeReportSchema.safeParse(form)
        if (!parseResult.success) {
            toast.error("Please fill out all required fields correctly.")
            setLoading(false)
            return
        }
        try {
            const payload = {
                ...form,
                accused: form.accused.map((a) => a.id),
                victims: form.victims.map((v) => v.id),
            }
            const res = await fetch("/api/crime", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to submit crime report")
            toast.success("Crime reported successfully!")
            router.push("/dashboard")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="lex items-center justify-between px-4 lg:px-6 md:mx-6">
            <CardContent className="w-full">
                <h2 className="text-2xl font-semibold mb-4">Report a Crime</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid gap-4">
                        <Label>Title</Label>
                        <Input
                            name="title"
                            placeholder="Enter a brief title for the crime report"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                        <Label>Crime Type</Label>
                        <Select
                            value={form.crimeType}
                            onValueChange={(value) =>
                                setForm((prev) => ({ ...prev, crimeType: value }))
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a crime type" />
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
                        <Label>Description</Label>
                        <Textarea
                            name="description"
                            placeholder="Describe the details of the crime here..."
                            value={form.description}
                            onChange={handleChange}
                        />
                        <Label>Date Occurred</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "max-w-full w-3/4 justify-start text-left font-normal",
                                        !form.dateOccurred && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {form.dateOccurred ? format(new Date(form.dateOccurred), "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={form.dateOccurred ? new Date(form.dateOccurred) : undefined}
                                    onSelect={(date) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            dateOccurred: date?.toISOString().split("T")[0] || "",
                                        }))
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <fieldset className="grid grid-cols-1 lg:grid-cols-2 gap-4 border p-4 rounded">
                            <legend className="px-2 text-lg font-medium">Location</legend>
                            <Label>City</Label>
                            <Input
                                name="city"
                                placeholder="Enter the city"
                                value={form.location.city}
                                onChange={handleChange}
                            />
                            <Label>State</Label>
                            <Input
                                name="state"
                                placeholder="Enter the state or province"
                                value={form.location.state}
                                onChange={handleChange}
                            />
                            <Label>Country</Label>
                            <Input
                                name="country"
                                placeholder="Enter the country"
                                value={form.location.country}
                                onChange={handleChange}
                            />
                        </fieldset>
                    </div>

                    {/* Accused Section */}
                    <div className="space-y-4">
                        <UserSearchInput
                            label="Accused"
                            query={accusedQuery}
                            setQuery={setAccusedQuery}
                            suggestions={accusedSuggestions}
                            onSelect={handleAddAccused}
                        />
                        {form.accused.length > 0 && (
                            <div className="space-y-2">
                                {form.accused.map((accused) => (
                                    <div
                                        key={accused.id}
                                        className="flex justify-between items-center p-2 border rounded"
                                    >
                                        <span>{accused.name}</span>
                                        <Button
                                            type="button"
                                            onClick={() => handleRemoveAccused(accused.id)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Victim Section */}
                    <div className="space-y-4">
                        <UserSearchInput
                            label="Victim"
                            query={victimQuery}
                            setQuery={setVictimQuery}
                            suggestions={victimSuggestions}
                            onSelect={handleAddVictim}
                        />
                        {form.victims.length > 0 && (
                            <div className="space-y-2">
                                {form.victims.map((victim) => (
                                    <div
                                        key={victim.id}
                                        className="flex justify-between items-center p-2 border rounded"
                                    >
                                        <span>{victim.name}</span>
                                        <Button
                                            type="button"
                                            onClick={() => handleRemoveVictim(victim.id)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Evidence Section */}
                    <div>
                        <Label className="mb-2">Evidence (Images)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Add photos or videos to support your report.
                        </p>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button type="button">
                                    {editingIndex !== null ? "Edit Evidence" : "Add Evidence"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingIndex !== null ? "Edit Evidence" : "Add Evidence"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Fill in the evidence details below.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Label>Evidence Type</Label>
                                    <Input
                                        name="evidenceType"
                                        placeholder="E.g., Photo, Video, Document"
                                        value={newEvidence.evidenceType}
                                        onChange={handleEvidenceDetailsChange}
                                    />
                                    <Label>Description</Label>
                                    <Textarea
                                        name="description"
                                        placeholder="Enter a description for this evidence"
                                        value={newEvidence.description}
                                        onChange={handleEvidenceDetailsChange}
                                    />
                                    <Label>Upload Image</Label>
                                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <DialogFooter className="mt-4 space-x-2">
                                    <Button onClick={handleAddEvidence}>
                                        {editingIndex !== null ? "Save" : "Add"} Evidence
                                    </Button>
                                    <Button onClick={() => setDialogOpen(false)} variant="outline">
                                        Cancel
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Evidence Preview List */}
                    {form.evidence.length > 0 && (
                        <div className="mt-4 grid gap-4">
                            {form.evidence.map((evidence, index) => (
                                <ContextMenu key={index}>
                                    <ContextMenuTrigger>
                                        <Card className="cursor-pointer">
                                            <CardContent>
                                                <img
                                                    src={evidence.img}
                                                    alt="Evidence"
                                                    className="w-full h-auto mb-2 rounded"
                                                />
                                                <h3 className="font-semibold">{evidence.evidenceType}</h3>
                                                <p>{evidence.description}</p>
                                            </CardContent>
                                        </Card>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem onClick={() => handleEditEvidence(index)}>
                                            Edit
                                        </ContextMenuItem>
                                        <ContextMenuItem onClick={() => handleDeleteEvidence(index)}>
                                            Delete
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))}
                        </div>
                    )}

                    <Button type="submit" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Crime Report"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default CrimeReportForm

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
    })
}
