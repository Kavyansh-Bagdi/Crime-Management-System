'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signOut } from 'next-auth/react'; // to handle logging out

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.message);
                }
            } catch (error) {
                setError('Failed to fetch user data');
            }
        };

        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: '/auth/signin' });
        } catch (error) {
            setError('Failed to log out');
        }
    };

    if (error) {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!user) {
        return <p className="text-sm text-gray-500">Loading...</p>;
    }

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <h5 className="text-xl font-semibold">
                            <strong>Name:</strong> {user.firstName} {user.lastName}
                        </h5>
                        <p className="text-base">
                            <strong>Email:</strong> {user.email}
                        </p>
                        <p className="text-base">
                            <strong>Role:</strong> {user.role}
                        </p>

                        {/* Conditional rendering for administrative details */}
                        {user.administrative && (
                            <div>
                                <h6 className="text-lg font-medium">Administrative Details</h6>
                                <p className="text-base">
                                    <strong>Designation:</strong> {user.administrative.designation}
                                </p>
                                <p className="text-base">
                                    <strong>Department:</strong> {user.administrative.department}
                                </p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <Button variant="outline" className="mt-4" onClick={() => router.push('/profile/edit')}>Edit Profile</Button>
                        <Button variant="destructive" className="mt-4" onClick={handleLogout}>Log Out</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
