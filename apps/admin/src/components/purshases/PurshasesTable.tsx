
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
            id: 0
        },
        shop_of_buy: {
            name: "Amazon",
            id: 0,
            link: ""
        },
        status_of_shopping: "Unpaid",
        total_cost_of_shopping: 905,
        buyed_products: []
    },
    {
        id: 2,
        buy_date: "2023-10-01",
        shopping_account: {
            account_name: "Rosi T.",
            id: 0
        },
        shop_of_buy: {
            name: "Temu",
            id: 0,
            link: ""
        },
        status_of_shopping: "Paid",
        total_cost_of_shopping: 28.5,
    },
    {
        id: 3,
        buy_date: "2023-10-05",
        shopping_account: { id: 3, account_name: "TMarey" },
        shop_of_buy: {
            name: "Temu",
            id: 0,
            link: ""
        },
        status_of_shopping: "Processing",
        total_cost_of_shopping: 183,
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
