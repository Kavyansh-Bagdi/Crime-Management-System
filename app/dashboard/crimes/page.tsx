"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { useSession } from "next-auth/react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    VisibilityState,
    SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconLayoutColumns,
} from "@tabler/icons-react";
import {
    IconChartBar,
    IconDashboard,
    IconFolder,
    IconInnerShadowTop,
    IconListDetails,
    IconReport,
    IconUsers,
} from "@tabler/icons-react";

interface Crime {
    crimeId: number;
    title: string;
    crimeType: string;
    status: string;
    dateOccurred: string;
}

export default function CrimesPage() {
    const router = useRouter(); // Initialize useRouter
    const { data: session } = useSession();
    const [crimes, setCrimes] = useState<Crime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [pageIndex, setPageIndex] = useState(0);

    useEffect(() => {
        async function fetchCrimes() {
            try {
                const response = await fetch("/api/crimes");
                if (!response.ok) throw new Error("Failed to fetch crimes");
                const data = await response.json();
                
                // Filter crimes based on user role
                let filteredCrimes = data;
                if (session?.user) {
                    const userId = session.user.id;
                    const userRole = session.user.role;
                    
                    if (userRole === "Civilian") {
                        // Show only crimes reported by the civilian
                        filteredCrimes = data.filter((crime: any) => crime.userId === userId);
                    } else if (userRole === "Administrative") {
                        // Show crimes assigned to the administrative officer
                        filteredCrimes = data.filter((crime: any) => crime.administrative?.userId === userId);
                    }
                    // Admin can see all crimes, so no filtering needed
                }
                
                setCrimes(filteredCrimes);
            } catch (error) {
                console.error("Error fetching crimes:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCrimes();
    }, [session]);

    const columns: ColumnDef<Crime>[] = [
        { accessorKey: "crimeId", header: "ID" },
        { accessorKey: "title", header: "Title" },
        { accessorKey: "crimeType", header: "Type" },
        { accessorKey: "status", header: "Status" },
        {
            accessorKey: "dateOccurred",
            header: "Date Occurred",
            cell: ({ row }) => new Date(row.original.dateOccurred).toLocaleDateString(),
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <Button onClick={() => handleViewDetails(row.original.crimeId)}>View Details</Button>
            ),
        },
    ];

    const handleViewDetails = (crimeId: number) => {
        router.push(`/dashboard/crimes/${crimeId}`); // Redirect to the dynamic route
    };

    const table = useReactTable({
        data: crimes,
        columns,
        state: {
            globalFilter,
            sorting,
            columnVisibility,
            pagination: {
                pageIndex,
                pageSize: recordsPerPage,
            },
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: (updater) => {
            const newPagination =
                typeof updater === "function"
                    ? updater({ pageIndex, pageSize: recordsPerPage })
                    : updater;
            setPageIndex(newPagination.pageIndex);
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        globalFilterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
        },
    });

    if (isLoading) {
        return <p>Loading...</p>;
    }
    const totalCrimes = crimes.length;
    const openCrimes = crimes.filter(c => c.status.toLowerCase() === "open").length;
    const closedCrimes = crimes.filter(c => c.status.toLowerCase() === "closed").length;
    const uniqueTypes = [...new Set(crimes.map(c => c.crimeType))];

    return (
        <div className="space-y-4 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Crimes Card */}
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                        <IconDashboard className="h-5 w-5 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">Total Crimes</div>
                    </div>
                    <div className="text-4xl font-bold">{totalCrimes}</div> {/* Increased the number size */}
                    <p className="text-xs text-muted-foreground mt-2"> {/* Decreased the description size */}
                        The total number of reported crimes so far in the system.
                    </p>
                </div>

                {/* Open Cases Card */}
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                        <IconFolder className="h-5 w-5 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">Open Cases</div>
                    </div>
                    <div className="text-4xl font-bold">{openCrimes}</div> {/* Increased the number size */}
                    <p className="text-xs text-muted-foreground mt-2"> {/* Decreased the description size */}
                        The number of active or ongoing criminal cases that are currently being investigated.
                    </p>
                </div>

                {/* Closed Cases Card */}
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                        <IconReport className="h-5 w-5 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">Closed Cases</div>
                    </div>
                    <div className="text-4xl font-bold">{closedCrimes}</div> {/* Increased the number size */}
                    <p className="text-xs text-muted-foreground mt-2"> {/* Decreased the description size */}
                        The number of criminal cases that have been resolved and closed.
                    </p>
                </div>

                {/* Crime Types Card */}
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                        <IconChartBar className="h-5 w-5 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">Crime Types</div>
                    </div>
                    <div className="text-4xl font-bold">{uniqueTypes.length}</div> {/* Increased the number size */}
                    <p className="text-xs text-muted-foreground mt-2"> {/* Decreased the description size */}
                        The total number of unique crime categories recorded in the system.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search crimes..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex items-center gap-4">
                    <Select
                        value={recordsPerPage.toString()}
                        onValueChange={(value) => {
                            setRecordsPerPage(Number(value));
                            setPageIndex(0); // reset to first page
                        }}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Records per page" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <IconLayoutColumns className="mr-2 h-4 w-4" />
                                Customize Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader className="bg-accent">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="px-4 py-2">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-4 py-2">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center">
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <IconChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
