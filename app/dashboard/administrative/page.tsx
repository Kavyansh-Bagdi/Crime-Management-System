"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AdministrativeDataTable } from "@/components/administrative/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import ForbiddenError from "@/app/forbidden"; // Import ForbiddenError
import { useRouter } from "next/navigation"; // Use next/navigation

export default function AdministrativePage() {
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    // useEffect(() => {
    //     async function checkAccess() {
    //         try {
    //             const response = await fetch("/api/administrative/access");
    //             if (!response.ok) throw new Error("Forbidden");
    //             setHasAccess(true);
    //         } catch (error) {
    //             setHasAccess(false);
    //         }
    //     }
    //     checkAccess();
    // }, []);

    // if (hasAccess === null) return <div>Loading...</div>;
    // if (!hasAccess) return <ForbiddenError />; // Render ForbiddenError if access is denied

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        designation: "",
        department: "",
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.designation || !formData.department) {
            toast.error("All fields are required.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/administrative", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error("Failed to create administrative entry");
            toast.success("Administrative entry created successfully!");
            router.push("/dashboard/administrative"); // Use next/navigation for navigation
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                designation: "",
                department: "",
            });
        } catch (error) {
            toast.error("Error creating administrative entry. Please try again.");
            console.error("Error creating administrative entry:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Administration Dashboard</h1>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Add Administrative</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Administrative</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="grid gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        placeholder="Enter last name"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="designation">Designation</Label>
                                    <Select
                                        value={formData.designation}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, designation: value }))
                                        }
                                    >
                                        <SelectTrigger id="designation" className="w-full">
                                            <SelectValue placeholder="Select designation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Officer">Officer</SelectItem>
                                            <SelectItem value="Detective">Detective</SelectItem>
                                            <SelectItem value="Sergeant">Sergeant</SelectItem>
                                            <SelectItem value="Lieutenant">Lieutenant</SelectItem>
                                            <SelectItem value="Captain">Captain</SelectItem>
                                            <SelectItem value="Major">Major</SelectItem>
                                            <SelectItem value="DeputyChief">Deputy Chief</SelectItem>
                                            <SelectItem value="Chief">Chief</SelectItem>
                                            <SelectItem value="Commissioner">Commissioner</SelectItem>
                                            <SelectItem value="Sheriff">Sheriff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Select
                                        value={formData.department}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, department: value }))
                                        }
                                    >
                                        <SelectTrigger id="department" className="w-full">
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Homicide">Homicide</SelectItem>
                                            <SelectItem value="Narcotics">Narcotics</SelectItem>
                                            <SelectItem value="CyberCrime">CyberCrime</SelectItem>
                                            <SelectItem value="Traffic">Traffic</SelectItem>
                                            <SelectItem value="Forensics">Forensics</SelectItem>
                                            <SelectItem value="InternalAffairs">Internal Affairs</SelectItem>
                                            <SelectItem value="K9Unit">K9 Unit</SelectItem>
                                            <SelectItem value="SWAT">SWAT</SelectItem>
                                            <SelectItem value="Vice">Vice</SelectItem>
                                            <SelectItem value="Patrol">Patrol</SelectItem>
                                            <SelectItem value="Intelligence">Intelligence</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Submitting..." : "Submit"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <AdministrativeDataTable />
        </div>
    );
}
