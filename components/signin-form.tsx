'use client';

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["Civilian", "Admin", "Administrative"], {
    message: "Role must be Civilian, Admin, or Administrative",
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      role: data.role,
      redirect: false,
      callbackUrl: '/u'
    });

    if (res?.error) {
      switch (res.error) {
        case "MISSING_FIELDS":
          toast.error("Please fill in all fields.");
          break;
        case "USER_NOT_FOUND":
          toast.error("No user found with this email.");
          break;
        case "INVALID_PASSWORD":
          toast.error("Incorrect password.");
          break;
        case "INVALID_ROLE":
          toast.error("Selected role does not match the account.");
          break;
        default:
          toast.error("Something went wrong. Please try again.");
      }
    } else {
      toast.success("Login successful!");
      router.push("/dashboard");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email below to login to your account
        </p>
      </div>

      <div className="grid gap-4">
        {/* Email Input */}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Role Select Input using Controller */}
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <Select value={value} onValueChange={onChange} aria-invalid={errors.role ? "true" : "false"}>
                <SelectTrigger className="w-full">
                  <span>{value || "Select a role"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Civilian">Civilian</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </div>

      {/* Sign Up Link */}
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/auth/signup" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  );
}
