
import * as React from "react";
import { StatusBadge } from "./StatusBadge";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Box, Edit2, Trash2 } from "lucide-react";
import type { ShoppingReceip } from "@/types";



// Mock data for ShoppingReceip type
const mockPurchases: ShoppingReceip[] = [
    {
        id: 1,
        buy_date: "2023-09-15",
        shopping_account: {
            account_name: "AlbertA",
            id: 0,
            created_at: "2023-09-01T10:00:00Z",
            updated_at: "2023-09-01T10:00:00Z"
        },
        shop_of_buy: {
            name: "Amazon",
            id: 0,
            link: "https://amazon.com",
            is_active: true,
            created_at: "2023-08-01T10:00:00Z",
            updated_at: "2023-08-01T10:00:00Z"
        },
        status_of_shopping: "No pagado",
        total_cost_of_shopping: 905,
        buyed_products: [],
        created_at: "2023-09-15T10:00:00Z",
        updated_at: "2023-09-15T10:00:00Z"
    },
    {
        id: 2,
        buy_date: "2023-10-01",
        shopping_account: {
            account_name: "Rosi T.",
            id: 0,
            created_at: "2023-09-15T10:00:00Z",
            updated_at: "2023-09-15T10:00:00Z"
        },
        shop_of_buy: {
            name: "Temu",
            id: 0,
            link: "https://temu.com",
            is_active: true,
            created_at: "2023-08-15T10:00:00Z",
            updated_at: "2023-08-15T10:00:00Z"
        },
        status_of_shopping: "Pagado",
        total_cost_of_shopping: 28.5,
        created_at: "2023-10-01T10:00:00Z",
        updated_at: "2023-10-01T10:00:00Z"
    },
    {
        id: 3,
        buy_date: "2023-10-05",
        shopping_account: { 
            id: 3, 
            account_name: "TMarey",
            created_at: "2023-09-20T10:00:00Z",
            updated_at: "2023-09-20T10:00:00Z"
        },
        shop_of_buy: {
            name: "Temu",
            id: 0,
            link: "https://temu.com",
            is_active: true,
            created_at: "2023-08-15T10:00:00Z",
            updated_at: "2023-08-15T10:00:00Z"
        },
        status_of_shopping: "Parcial",
        total_cost_of_shopping: 183,
        created_at: "2023-10-05T10:00:00Z",
        updated_at: "2023-10-05T10:00:00Z"
    },
];

const PurshasesTable: React.FC = () => {
    return (
        <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
            <Table>
                <TableHeader className="bg-gray-100 ">
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Tienda</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Costo Total</TableHead>
                        <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockPurchases.map((purshase, index) => (
                        <TableRow key={purshase.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{"#00" + purshase.id}</TableCell>
                            <TableCell>{purshase.shop_of_buy.name}</TableCell>
                            <TableCell>{purshase.shopping_account.account_name}</TableCell>
                            <TableCell>
                                <div className="flex flex-row text-gray-600 gap-1">
                                    <Box className="h-5 w-5" />
                                    <span className="">
                                        {purshase.buyed_products ? purshase.buyed_products?.length : 0}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={purshase.status_of_shopping} />
                            </TableCell>
                            <TableCell>${purshase.total_cost_of_shopping.toFixed(2)}</TableCell>
                            <TableCell>
                                <Button variant="secondary" className="mr-2">
                                    <Edit2 className="h-5 w-5" />
                                </Button>
                                <Button variant="secondary">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default PurshasesTable;
