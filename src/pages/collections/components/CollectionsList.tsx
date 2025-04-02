
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collection } from "@/types/collection";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CollectionsListProps {
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
}

export const CollectionsList = ({ collections, onSelectCollection }: CollectionsListProps) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "pending":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                No collections found
              </TableCell>
            </TableRow>
          ) : (
            collections.map((collection) => (
              <TableRow 
                key={collection.id}
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => onSelectCollection(collection)}
              >
                <TableCell className="font-medium">{collection.customer_name}</TableCell>
                <TableCell>${collection.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {collection.due_date ? 
                    format(new Date(collection.due_date), 'MMM dd, yyyy') : 
                    'Not set'
                  }
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(collection.status)}>
                    {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CollectionsList;
