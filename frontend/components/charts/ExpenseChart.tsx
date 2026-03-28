"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Food", value: 8000 },
  { name: "Rent", value: 15000 },
  { name: "Travel", value: 4000 },
  { name: "Shopping", value: 3000 },
];

const COLORS = ["#4F46E5", "#22C55E", "#F59E0B", "#EF4444"];

export default function ExpenseChart() {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">
        Expense Breakdown
      </h2>

      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={90}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}