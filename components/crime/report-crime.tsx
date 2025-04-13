"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { string } from "zod"

interface Evidence {
    evidenceType: string;
    description: string;
    img: string; // Base64 encoded image
}

interface Form {
    title: string;
    crimeType: string;
    description: string;
    dateOccurred: string;
    accusedId: string;
    victimId: string;
    administrativeId: string;
    location: {
        city: string;
        state: string;
        country: string;
    };
    evidence: Evidence[]; // Array of Evidence objects
}

const CrimeReportForm = () => {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState<Form>({
        title: "",
        crimeType: "",
        description: "",
        dateOccurred: "",
        accusedId: "",
        victimId: "",
        administrativeId: "",
        location: {
            city: "",
            state: "",
            country: "",
        },
        evidence: [],
    })

    const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
    const [currentEvidence, setCurrentEvidence] = useState<File | null>(null)
    const [evidenceDetails, setEvidenceDetails] = useState({
        evidenceType: "",
        description: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name in form.location) {
            setForm((prev) => ({ ...prev, location: { ...prev.location, [name]: value } }))
        } else {
            setForm((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            setEvidenceFiles(files)
            setCurrentEvidence(files[0]) // Take the first file for evidence details
        }
    }

    const handleEvidenceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setEvidenceDetails((prev) => ({ ...prev, [name]: value }))
    }

    const handleEvidenceSubmit = async () => {
        if (currentEvidence) {
            const base64 = await fileToBase64(currentEvidence);  // Convert file to base64
            setForm((prev) => ({
                ...prev,
                evidence: [
                    ...prev.evidence,
                    {
                        evidenceType: evidenceDetails.evidenceType,
                        description: evidenceDetails.description,
                        img: base64,  // Store base64 encoded image
                    },
                ],
            }));
        }
        setCurrentEvidence(null);
        setEvidenceDetails({
            evidenceType: "",
            description: "",
        });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const evidence = await Promise.all(
                form.evidence.map(async (file) => {
                    const base64 = await fileToBase64(file.img)
                    return {
                        evidenceType: file.evidenceType,
                        img: base64,
                    }
                })
            )


            const payload = {
                ...form,
                accusedId: form.accusedId ? Number(form.accusedId) : undefined,
                victimId: form.victimId ? Number(form.victimId) : undefined,
                administrativeId: form.administrativeId ? Number(form.administrativeId) : undefined,
                evidence,
            }

            const res = await fetch("/api/crime", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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
        <Card className="max-w-2xl mx-auto p-6 mt-6">
            <CardContent>
                <h2 className="text-2xl font-semibold mb-4">Report a Crime</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Label>
                        Title
                        <Input name="title" value={form.title} onChange={handleChange} required />
                    </Label>
                    <Label>
                        Crime Type
                        <Input name="crimeType" value={form.crimeType} onChange={handleChange} required />
                    </Label>

                    <Label>
                        Description
                        <Textarea name="description" value={form.description} onChange={handleChange} />
                    </Label>

                    <Label>
                        Date Occurred
                        <Input type="date" name="dateOccurred" value={form.dateOccurred} onChange={handleChange} required />
                    </Label>

                    <Label>
                        Accused User ID (optional)
                        <Input type="number" name="accusedId" value={form.accusedId} onChange={handleChange} />
                    </Label>

                    <Label>
                        Victim User ID (optional)
                        <Input type="number" name="victimId" value={form.victimId} onChange={handleChange} />
                    </Label>

                    <Label>
                        Administrative User ID (optional)
                        <Input type="number" name="administrativeId" value={form.administrativeId} onChange={handleChange} />
                    </Label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Label>
                            City
                            <Input name="city" value={form.location.city} onChange={handleChange} required />
                        </Label>
                        <Label>
                            State
                            <Input name="state" value={form.location.state} onChange={handleChange} required />
                        </Label>
                        <Label>
                            Country
                            <Input name="country" value={form.location.country} onChange={handleChange} required />
                        </Label>
                    </div>

                    <Label>
                        Evidence (Images)
                        <Input type="file" accept="image/*" multiple onChange={handleFileChange} />
                    </Label>

                    <Button type="submit" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Crime Report"}
                    </Button>
                </form>

                {/* Popover for Evidence Details */}
                {currentEvidence && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                Add Evidence Details
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className="space-y-2">
                                <Label>
                                    Evidence Type
                                    <Input
                                        name="evidenceType"
                                        value={evidenceDetails.evidenceType}
                                        onChange={handleEvidenceDetailsChange}
                                    />
                                </Label>
                                <Label>
                                    Description
                                    <Textarea
                                        name="description"
                                        value={evidenceDetails.description}
                                        onChange={handleEvidenceDetailsChange}
                                    />
                                </Label>
                                <Button onClick={handleEvidenceSubmit}>Submit Evidence</Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
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
