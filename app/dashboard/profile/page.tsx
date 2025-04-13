"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Use toast directly
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Import shadcn calendar
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import NotFoundError from "@/app/not-found-error"; // Import NotFoundError

// Define the type for the user object
type User = {
    userId: number;
    firstName: string;
    lastName?: string;
    dob?: string;
    location?: string;
    phoneNumber?: string;
    email: string;
    password: string;
    role: string;
    adminDetails?: {
        adminId: number;
    };
    administrativeDetails?: {
        badgeNumber: number;
        designation: string;
        department: string;
    };
};

export default function ProfilePage() {
    const router = useRouter(); // Initialize useRouter
    const [user, setUser] = useState<User | null>(null); // Explicitly define the type
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [dob, setDob] = useState<string | undefined>(undefined); // Updated to string for consistency
    const [locationQuery, setLocationQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [locationFocused, setLocationFocused] = useState(false); // Track focus state

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch("/api/profile");
                if (!res.ok) throw new Error("Failed to fetch user data");
                const data: User = await res.json(); // Use 'data' as returned by the API
                setUser(data);
                setDob(data.dob || ""); // Ensure dob is set correctly
                setLocationQuery(data.location || ""); // Set location
            } catch (error: any) {
                console.error("Error fetching profile:", error.message);
                toast.error(error.message || "An error occurred while fetching profile data.");
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!locationFocused || locationQuery.length < 3) {
                setSuggestions([]);
                return;
            }

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${locationQuery}&addressdetails=1`
                );
                const data = await res.json();
                const results = data.map((item: any) => {
                    const city = item.address.city || item.address.town || item.address.village || "";
                    const state = item.address.state || "";
                    const country = item.address.country || "";
                    return `${city}, ${state}, ${country}`.replace(/^, |, ,|, $/g, "");
                });
                setSuggestions(results.slice(0, 5));
            } catch (err) {
                console.error("Location fetch error:", err);
                setSuggestions([]);
            }
        };

        const timeout = setTimeout(fetchSuggestions, 300); // debounce
        return () => clearTimeout(timeout);
    }, [locationQuery, locationFocused]);

    async function handleUpdate() {
        setUpdating(true);
        try {
            const payload = {
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
                phoneNumber: user?.phoneNumber || "",
                dob: dob || "",
                location: locationQuery || "", // Send location
            };

            console.log("Payload being sent:", payload);

            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API response error:", errorText);
                throw new Error("Failed to update profile");
            }

            toast.success("Profile updated successfully");
            router.push("/dashboard"); // Use next/navigation for navigation
        } catch (error: any) {
            console.error("Error in handleUpdate:", error.message);
            toast.error(error.message || "An error occurred");
        } finally {
            setUpdating(false);
        }
    }

    if (loading) return <p>Loading...</p>;
    if (!user) return <NotFoundError />; // Render NotFoundError if user is not found

    return (
        <div className="p-4 m-6">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            {user && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">First Name</label>
                        <Input
                            value={user.firstName || ""}
                            onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Last Name</label>
                        <Input
                            value={user.lastName || ""}
                            onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="block text-sm font-medium">Date of Birth</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dob && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dob ? new Date(dob).toLocaleDateString() : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dob ? new Date(dob) : undefined}
                                    onSelect={(date) => {
                                        if (date) {
                                            const formattedDate = date.toISOString().split("T")[0]; // "yyyy-mm-dd"
                                            setDob(formattedDate);
                                            setUser({ ...user, dob: formattedDate });
                                        }
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2 relative">
                        <label className="block text-sm font-medium">Location</label>
                        <Input
                            value={locationQuery}
                            onChange={(e) => {
                                setLocationQuery(e.target.value);
                                setUser({ ...user, location: e.target.value });
                            }}
                            onFocus={() => setLocationFocused(true)} // Set focus state
                            onBlur={(e) => {
                                // Delay clearing focus to allow onClick to trigger
                                setTimeout(() => setLocationFocused(false), 200);
                            }}
                            placeholder="City, State, Country"
                        />
                        {locationFocused && suggestions.length > 0 && ( // Show suggestions only when focused
                            <ul className="absolute z-10 top-full mt-1 w-full bg-accent border rounded shadow">
                                {suggestions.map((s, i) => (
                                    <li
                                        key={i}
                                        className="px-3 py-2 hover:bg-background cursor-pointer text-sm"
                                        onClick={() => {
                                            setLocationQuery(s);
                                            setUser({ ...user, location: s });
                                            setSuggestions([]);
                                        }}
                                    >
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Phone Number</label>
                        <Input
                            value={user.phoneNumber || ""}
                            onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <Input value={user.email} disabled />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Password</label>
                        <Input
                            type="password"
                            value={user.password || ""}
                            onChange={(e) => setUser({ ...user, password: e.target.value })}
                        />
                    </div>
                    {user.role === "Admin" && user.adminDetails && (
                        <div>
                            <label className="block text-sm font-medium">Admin ID</label>
                            <Input value={user.adminDetails.adminId.toString()} disabled />
                        </div>
                    )}
                    {user.role === "Administrative" && user.administrativeDetails && (
                        <>
                            <div>
                                <label className="block text-sm font-medium">Badge Number</label>
                                <Input
                                    value={user.administrativeDetails.badgeNumber.toString()}
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Designation</label>
                                <Input
                                    value={user.administrativeDetails.designation}
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Department</label>
                                <Input
                                    value={user.administrativeDetails.department}
                                    disabled
                                />
                            </div>
                        </>
                    )}
                    <Button onClick={handleUpdate} disabled={updating}>
                        {updating ? "Updating..." : "Update Profile"}
                    </Button>
                </div>
            )}
        </div>
    );
}
