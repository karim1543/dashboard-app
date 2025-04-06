export const columns = [
    {
      accessorKey: "id",
      header: "ID",
      enableSorting: true,
    },
    {
      accessorKey: "month",
      header: "Month",
      enableSorting: true,
    },
    {
      accessorKey: "sales",
      header: "Sales",
      enableSorting: true,
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.getValue("status") === "active" 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {row.getValue("status")}
        </span>
      )
    }
  ];