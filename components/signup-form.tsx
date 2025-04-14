'use client'
import { useEffect } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
const signupSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    dob: z.string().optional(),
    location: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [locationQuery, setLocationQuery] = useState("")
    const [suggestions, setSuggestions] = useState<string[]>([])

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    })

    const dob = watch("dob")

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (locationQuery.length < 3) {
                setSuggestions([])
                return
            }

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${locationQuery}&addressdetails=1`
                )
                const data = await res.json()
                const results = data.map((item: any) => {
                    const city = item.address.city || item.address.town || item.address.village || ""
                    const state = item.address.state || ""
                    const country = item.address.country || ""
                    return `${city}, ${state}, ${country}`.replace(/^, |, ,|, $/g, "")
                })
                setSuggestions(results.slice(0, 5))
            } catch (err) {
                console.error("Location fetch error:", err)
                setSuggestions([])
            }
        }

        const timeout = setTimeout(fetchSuggestions, 300) // debounce
        return () => clearTimeout(timeout)
    }, [locationQuery])


    const onSubmit = async (data: SignupFormData) => {
        setLoading(true)
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            const result = await res.json()
            setLoading(false)

            if (res.ok) {
                toast.success("Account created! Redirecting to login...")
                router.push("/auth/signin")
            } else {
                toast.error(result.message || "Signup failed")
            }
        } catch (error) {
            toast.error("Something went wrong")
            setLoading(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className={cn("flex flex-col gap-6", className)}
            {...props}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
            </div>
            <div className="grid gap-4">
                <div className="flex gap-3">
                    <div className="grid gap-2 w-full">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            placeholder="John"
                            {...register("firstName")}
                        />
                        {errors.firstName && (
                            <p className="text-sm text-red-500">{errors.firstName.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2 w-full">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            placeholder="Doe"
                            {...register("lastName")}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="dob">Date of Birth</Label>
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
                                {dob ? format(new Date(dob), "PPP") : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dob ? new Date(dob) : undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        const formattedDate = date.toISOString().split("T")[0] // "yyyy-mm-dd"
                                        setValue("dob", formattedDate)
                                    }
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid gap-2 relative">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        placeholder="City, State, Country"
                        value={locationQuery}
                        onChange={(e) => {
                            setLocationQuery(e.target.value)
                            setValue("location", e.target.value)
                        }}
                    />
                    {suggestions.length > 0 && (
                        <ul className="absolute z-10 top-full mt-1 w-full bg-accent border rounded shadow">
                            {suggestions.map((s, i) => (
                                <li
                                    key={i}
                                    className="px-3 py-2 hover:bg-background cursor-pointer text-sm"
                                    onClick={() => {
                                        setLocationQuery(s)
                                        setValue("location", s)
                                        setSuggestions([])
                                    }}
                                >
                                    {s}
                                </li>
                            ))}
                        </ul>
                    )}
                    {errors.location && (
                        <p className="text-sm text-red-500">{errors.location.message}</p>
                    )}
                </div>



                <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" placeholder="+1234567890" {...register("phoneNumber")} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Sign Up"}
                </Button>
            </div>

            <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/auth/signin" className="underline underline-offset-4">
                    Sign in
                </a>
            </div>
        </form>
    )
}
