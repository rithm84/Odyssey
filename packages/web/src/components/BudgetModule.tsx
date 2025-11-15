import { DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const expenses = [
  {
    item: "Campsite reservation",
    paidBy: { name: "Sarah Johnson", initials: "SJ" },
    amount: 120,
    splitBetween: ["SJ", "MC", "ED", "JW", "LA", "TM"],
    perPerson: 20,
    paymentDate: "Nov 10",
  },
  {
    item: "Groceries",
    paidBy: { name: "Mike Chen", initials: "MC" },
    amount: 180,
    splitBetween: ["SJ", "MC", "ED", "JW", "LA", "TM"],
    perPerson: 30,
    paymentDate: "Nov 14",
  },
  {
    item: "Firewood & supplies",
    paidBy: { name: "Emily Davis", initials: "ED" },
    amount: 45,
    splitBetween: ["SJ", "MC", "ED", "JW", "LA", "TM"],
    perPerson: 7.5,
    paymentDate: "Nov 14",
  },
];

export function BudgetModule() {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Card className="p-6 shadow-soft transition-smooth hover:shadow-medium">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          Budget Tracker
        </h2>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-primary">${totalExpenses}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Split Between</TableHead>
              <TableHead className="text-right">Per Person</TableHead>
              <TableHead>Payment Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{expense.item}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-primary text-white text-xs">
                      <AvatarFallback className="bg-primary text-xs">
                        {expense.paidBy.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{expense.paidBy.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${expense.amount}
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {expense.splitBetween.map((person, i) => (
                      <Avatar key={i} className="h-6 w-6 bg-secondary text-white text-xs border-2 border-background">
                        <AvatarFallback className="bg-secondary text-xs">
                          {person}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">${expense.perPerson}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {expense.paymentDate}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}