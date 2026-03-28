"use client";

export default function FinancialOverview() {
  return (
    <div className="grid grid-cols-3 gap-6">

      {/* Emergency Fund */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h3 className="text-sm text-gray-500 mb-2">
          Emergency Fund
        </h3>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div className="bg-green-500 h-2 w-[60%] rounded-full"></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          60% of target achieved
        </p>
      </div>

      {/* Debt Ratio */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h3 className="text-sm text-gray-500 mb-2">
          Debt Ratio
        </h3>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div className="bg-red-500 h-2 w-[40%] rounded-full"></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          40% of income
        </p>
      </div>

      {/* Income vs Expense */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h3 className="text-sm text-gray-500 mb-2">
          Income vs Expense
        </h3>

        <div className="flex items-end gap-2 h-16">
          <div className="bg-indigo-500 w-4 h-[80%] rounded"></div>
          <div className="bg-red-400 w-4 h-[60%] rounded"></div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Income higher than expenses
        </p>
      </div>

    </div>
  );
}