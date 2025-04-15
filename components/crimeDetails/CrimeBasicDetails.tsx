import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface CrimeBasicDetailsProps {
    formData: any;
    setFormData: (data: any) => void;
    dateOccurred: Date | undefined;
    setDateOccurred: (date: Date | undefined) => void;
    isCivilian: boolean;
}

export function CrimeBasicDetails({ formData, setFormData, dateOccurred, setDateOccurred, isCivilian }: CrimeBasicDetailsProps) {
    return (
        <div className="space-y-4">
            <div className='flex w-full justify-evenly gap-4'>
                <div className='flex-1'>
                    <label className="block font-bold mb-2">Type</label>
                    <Select
                        disabled={isCivilian}
                        value={formData.crimeType}
                        onValueChange={(value) => setFormData({ ...formData, crimeType: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={formData.crimeType || "Select Crime Type"} />
                        </SelectTrigger>
                        <SelectContent>
                            {["Burglary", "Assault", "Fraud", "Robbery", "Arson", "Theft", "Vandalism", "Homicide", "Other"].map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className='flex-1'>
                    <label className="block font-bold mb-2">Status</label>
                    <Select
                        disabled={isCivilian}
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={formData.status || "Select Status"} />
                        </SelectTrigger>
                        <SelectContent>
                            {["Accepted", "Rejected", "Reported", "Investigation", "Closed", "Pending"].map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
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
                                    setFormData((prev: any) => ({
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
        </div>
    );
}
