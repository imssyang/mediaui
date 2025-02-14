"use client"

import { useEffect, useState } from "react"
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
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
import { useTask } from "./state"

const columns: ColumnDef<WebRTCStreamStats>[] = [
  {
    accessorKey: "Transport",
    cell: ({ row }) => row.original.transportId,
  },
  {
    accessorKey: "BoundRtp",
    enableHiding: false,
    cell: ({ row }) => {
      const stat = row.original;
      return (
        <div className="flex items-center">
            <Badge variant="outline">{stat.isRemote ? "remote" : "local"}</Badge>
            <div>{stat.boundRtpId}</div>
        </div>
      )
    },
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
    accessorKey: "direction",
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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    Transport: false,
    Codec: false,
    Track: false,
    Channel: false,
    FmtpLine: false,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  })

  useEffect(() => {
    setData([...state.streamStats]);
  }, [state])

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Button variant="outline">
            Connection:
            <Badge variant="default">{state.connState}</Badge>
        </Button>
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
