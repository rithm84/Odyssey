import { DollarSign, TrendingUp } from "lucide-react";
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
    <Card className="p-6 shadow-soft transition-all duration-500 hover:shadow-glow border-border/60 backdrop-blur-sm bg-card/80 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <span>Budget Tracker</span>
            </h2>
            <p className="text-muted-foreground ml-[52px]">Shared expenses overview</p>
          </div>

          <div className="text-right bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 shadow-medium">
            <div className="flex items-center gap-2 justify-end mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Total Expenses</p>
            </div>
            <p className="text-3xl font-black text-gradient">${totalExpenses}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50 border-border/60">
                <TableHead className="font-bold">Item</TableHead>
                <TableHead className="font-bold">Paid By</TableHead>
                <TableHead className="text-right font-bold">Amount</TableHead>
                <TableHead className="font-bold">Split Between</TableHead>
                <TableHead className="text-right font-bold">Per Person</TableHead>
                <TableHead className="font-bold">Payment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, index) => (
                <TableRow key={index} className="hover:bg-muted/50 border-border/60 transition-colors">
                  <TableCell className="font-bold text-base dark:text-dark-base">{expense.item}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 gradient-primary text-white shadow-medium">
                        <AvatarFallback className="gradient-primary font-bold">
                          {expense.paidBy.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{expense.paidBy.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-black text-lg dark:text-dark-lg text-primary">
                    ${expense.amount}
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {expense.splitBetween.map((person, i) => (
                        <Avatar
                          key={i}
                          className="h-8 w-8 bg-[hsl(var(--accent-purple))] text-white border-2 border-background shadow-medium"
                        >
                          <AvatarFallback className="bg-[hsl(var(--accent-purple))] font-bold text-xs">
                            {person}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="gradient-neon text-white border-0 font-bold px-3 py-1.5 shadow-medium">
                      ${expense.perPerson}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">
                    {expense.paymentDate}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}