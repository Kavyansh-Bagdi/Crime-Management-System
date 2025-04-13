"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconLayoutColumns } from "@tabler/icons-react";

interface AdministrativeData {
    badgeNumber: number | null;
    designation: string | null;
    department: string | null;
    totalCases: number;
    ongoingCases: number;
    user: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
    };
}

export function AdministrativeDataTable() {
    const [administrativeData, setAdministrativeData] = React.useState<AdministrativeData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [sorting, setSorting] = React.useState([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        badgeNumber: false,
    });

    React.useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch("/api/administrative");
                if (!response.ok) throw new Error("Failed to fetch data");
                const data = await response.json();
                setAdministrativeData(data);
            } catch (error) {
                console.error("Failed to fetch administrative data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const columns: ColumnDef<AdministrativeData>[] = [
        {
            accessorKey: "badgeNumber",
            header: "Badge Number",
            cell: ({ row }) => row.original.badgeNumber || "N/A",
        },
        {
            accessorKey: "user",
            header: "Name",
            cell: ({ row }) => `${row.original.user.firstName} ${row.original.user.lastName}`,
        },
        {
            accessorKey: "user.email",
            header: "Email",
            cell: ({ row }) => row.original.user.email,
        },
        {
            accessorKey: "user.phoneNumber",
            header: "Phone Number",
            cell: ({ row }) => row.original.user.phoneNumber || "N/A",
        },
        {
            accessorKey: "designation",
            header: "Designation",
            cell: ({ row }) => row.original.designation || "N/A",
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => row.original.department || "N/A",
        },
        {
            accessorKey: "totalCases",
            header: "Total Cases",
            cell: ({ row }) => <div className="text-right">{row.original.totalCases}</div>,
        },
        {
            accessorKey: "ongoingCases",
            header: "Ongoing Cases",
            cell: ({ row }) => (
                <Badge variant={row.original.ongoingCases > 0 ? "warning" : "success"}>
                    {row.original.ongoingCases}
                </Badge>
            ),
        },
    ];

    const table = useReactTable({
        data: administrativeData,
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

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search across all fields..."
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
