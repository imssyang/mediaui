"use client"

import { useEffect, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { WebRTCStreamStats } from "@/webrtc/connection"
import { useWebRTCState } from "@/webrtc/state"
import { useTask } from "./task"

const columns: ColumnDef<WebRTCStreamStats>[] = [
  {
    accessorKey: "Peer",
    enableHiding: false,
    cell: ({ row }) => {
      const stat = row.original;
      return (
        <Badge variant="outline">
            {stat.isRemote ? "remote" : "local"}
        </Badge>
      )
    },
    filterFn: (row, _columnId, value) => {
        if (value === "all") return true;
        return value === "remote" ? row.original.isRemote : !row.original.isRemote;
    },
  },
  {
    accessorKey: "Transport",
    cell: ({ row }) => row.original.transportId,
  },
  {
    accessorKey: "BoundRtp",
    enableHiding: false,
    cell: ({ row }) => row.original.boundRtpId,
  },
  {
    accessorKey: "Codec",
    cell: ({ row }) => row.original.codecId,
  },
  {
    accessorKey: "Track",
    cell: ({ row }) => row.original.trackId,
  },
  {
    accessorKey: "isOutput",
    enableSorting: true,
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Direction
        </Button>
      )
    },
    cell: ({ row }) => row.original.isOutput ? "outbound" : "inbound",
    sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId) as boolean;
        const b = rowB.getValue(columnId) as boolean;
        return Number(a) - Number(b);
    },
    filterFn: (row, _columnId, value) => {
        if (value === "all") return true;
        return value === "outbound" ? row.original.isOutput : !row.original.isOutput;
    },
  },
  {
    accessorKey: "kind",
    enableSorting: true,
    enableHiding: false,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kind
        </Button>
      )
    },
    cell: ({ row }) => row.original.kind,
    filterFn: (row, _columnId, value) => {
        if (!value.length) return true;
        return value.includes(row.original.kind);
    },
  },
  {
    accessorKey: "MimeType",
    cell: ({ row }) => {
      const mimeType = row.original.mimeType;
      return mimeType?.split("/")?.[1] ?? "";
    },
  },
  {
    accessorKey: "Payload",
    cell: ({ row }) => row.original.payloadType,
  },
  {
    accessorKey: "SSRC",
    cell: ({ row }) => row.original.ssrc.toString(16),
  },
  {
    accessorKey: "ClockRate",
    cell: ({ row }) => row.original.clockRate,
  },
  {
    accessorKey: "Channel",
    cell: ({ row }) => row.original.channels,
  },
  {
    accessorKey: "FmtpLine",
    cell: ({ row }) => row.original.sdpFmtpLine,
  },
]

export function WebRTCStateTable() {
  const task = useTask();
  const state = useWebRTCState(task.connID);
  const [data, setData] = useState(state.streamStats);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    Transport: false,
    Codec: false,
    Track: false,
    Channel: false,
    FmtpLine: false,
  });
  const [selectedPeer, setSelectedPeer] = useState<string>("local");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  useEffect(() => {
    const colume = table.getColumn("Peer");
    colume?.setFilterValue(selectedPeer);

    if (["closed", "disconnected", "failed"].includes(state.connState)) {
        setData([]);
    } else {
        setData([...state.streamStats]);
    }
  }, [state])

  return (
    <div className="w-full">
      <div className="flex items-center py-3 gap-2">
        <Button variant="outline">
            Connection:
            <Badge variant="default">{state.connState}</Badge>
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Peer:
                    <Badge variant="secondary">{selectedPeer}</Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {["all", "remote", "local"].map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option}
                        checked={(table.getColumn("Peer")?.getFilterValue() as string)?.includes(option)}
                        onCheckedChange={() => {
                            setSelectedPeer(option);
                            const colume = table.getColumn("Peer");
                            return colume?.setFilterValue(option);
                        }}
                    >
                        {option}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Fields <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-20 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
