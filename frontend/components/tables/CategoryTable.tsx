"use client";
import { useMemo } from "react";

interface Transaction {
  type: "income" | "expense";
  category: string;
  amount: number;
}

interface Props {
  transactions: Transaction[];
}

export default function CategoryTable({ transactions }: Props) {
  const summary = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;

    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
      total += tx.amount;
    }

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? `${Math.round((amount / total) * 100)}%` : "0%",
      }));
  }, [transactions]);

  if (summary.length === 0) {
    return (
      <p className="text-xs text-slate-500 py-4 text-center">
        No expense categories yet. Add a transaction to see breakdown.
      </p>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-slate-500">
          <th className="text-left pb-2 font-semibold">Category</th>
          <th className="text-right pb-2 font-semibold">Amount</th>
          <th className="text-right pb-2 font-semibold">%</th>
        </tr>
      </thead>
      <tbody>
        {summary.map((item, i) => (
          <tr key={i} className="border-t border-white/5">
            <td className="py-2 font-medium">{item.name}</td>
            <td className="py-2 text-right font-mono">₹{item.amount.toLocaleString("en-IN")}</td>
            <td className="py-2 text-right text-indigo-400 font-bold">{item.percent}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}