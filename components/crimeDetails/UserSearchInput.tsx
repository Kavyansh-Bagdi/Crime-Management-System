import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type UserSearchInputProps = {
    label: string;
    query: string;
    setQuery: (value: string) => void;
    suggestions: any[];
    onSelect: (user: { userId: number; firstName: string, lastName: string, email: string, phoneNumber: string }) => void;
};

export function UserSearchInput({ label, query, setQuery, suggestions, onSelect }: UserSearchInputProps) {
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
                    {suggestions.map((user) => (
                        <li
                            key={user.userId}
                            className="px-3 py-2 hover:bg-background cursor-pointer text-sm"
                            onClick={() => onSelect({
                                userId: user.userId,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phoneNumber: user.phoneNumber,
                            })}
                        >
                            {user.firstName} {user.lastName} — {user.email}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
