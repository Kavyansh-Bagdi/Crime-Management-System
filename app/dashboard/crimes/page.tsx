"use client";

import { useEffect, useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconLayoutColumns } from "@tabler/icons-react";

export default function CrimePage() {
    const [crimes, setCrimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [stats, setStats] = useState({
        total: 0,
        reported: 0,
        underInvestigation: 0,
        closed: 0,
        reportedTrend: "+5%", // Example trend
        investigationTrend: "-2%", // Example trend
        closedTrend: "+10%", // Example trend
    });

    useEffect(() => {
        async function fetchCrimes() {
            try {
                const response = await fetch("/api/crime");
                if (!response.ok) throw new Error("Failed to fetch crimes");
                const data = await response.json();
                setCrimes(data);

                // Calculate statistics
                const total = data.length;
                const reported = data.filter((crime) => crime.status === "Reported").length;
                const underInvestigation = data.filter((crime) => crime.status === "Investigation").length;
                const closed = data.filter((crime) => crime.status === "Closed").length;

                // Example trends (mocked for now)
                const reportedTrend = "+5%";
                const investigationTrend = "-2%";
                const closedTrend = "+10%";

                setStats({ total, reported, underInvestigation, closed, reportedTrend, investigationTrend, closedTrend });
            } catch (error) {
                console.error("Error fetching crimes:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCrimes();
    }, []);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "title",
            header: "Title",
            cell: ({ row }) => row.original.title || "N/A",
        },
        {
            accessorKey: "crimeType",
            header: "Type",
            cell: ({ row }) => row.original.crimeType || "N/A",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => row.original.status || "N/A",
        },
        {
            accessorKey: "reportedBy",
            header: "Reported By",
            cell: ({ row }) => row.original.user?.firstName
                ? `${row.original.user.firstName} ${row.original.user.lastName || ""}`
                : "Unknown",
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <Button onClick={() => router.push(`/crime/${row.original.crimeId}`)}>
                    View Details
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: crimes,
        columns,
        state: {
            globalFilter,
            sorting,
            columnVisibility,
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        globalFilterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
        },
    });

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="space-y-4 p-6">
            {/* Enhanced Crime Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-secondary text-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Total Cases</h3>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm">All cases recorded in the system</p>
                </div>
                <div className="p-4 bg-secondary text-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Reported Cases</h3>
                    <p className="text-2xl font-bold">{stats.reported}</p>
                    <p className="text-sm flex items-center">
                        Trending: {stats.reportedTrend}{" "}
                        <span className="ml-1 text-green-500">↑</span>
                    </p>
                </div>
                <div className="p-4 bg-secondary text-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Under Investigation</h3>
                    <p className="text-2xl font-bold">{stats.underInvestigation}</p>
                    <p className="text-sm flex items-center">
                        Trending: {stats.investigationTrend}{" "}
                        <span className="ml-1 text-red-500">↓</span>
                    </p>
                </div>
                <div className="p-4 bg-secondary text-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Closed Cases</h3>
                    <p className="text-2xl font-bold">{stats.closed}</p>
                    <p className="text-sm flex items-center">
                        Trending: {stats.closedTrend}{" "}
                        <span className="ml-1 text-green-500">↑</span>
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
                                    No crimes found
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
