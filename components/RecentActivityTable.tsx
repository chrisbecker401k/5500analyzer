import { recentActivities } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export function RecentActivityTable() {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
        <a className="font-bold text-everhart-blue" href="/history">View all</a>
      </div>
      <div className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-3 font-semibold">Company</th>
              <th className="py-3 font-semibold">Plan Year</th>
              <th className="py-3 font-semibold">Assets (USD)</th>
              <th className="py-3 font-semibold">Status</th>
              <th className="py-3 font-semibold">Processed</th>
            </tr>
          </thead>
          <tbody>
            {recentActivities.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-everhart-blue text-xs font-bold text-white">
                      {row.companyName.split(" ").map((word) => word[0]).join("").slice(0, 2)}
                    </span>
                    <span className="font-medium text-slate-800">{row.companyName}</span>
                  </div>
                </td>
                <td className="py-3">{row.planYear}</td>
                <td className="py-3">{formatCurrency(row.endingAssets)}</td>
                <td className="py-3"><StatusBadge status={row.status} /></td>
                <td className="py-3">May {20 - recentActivities.indexOf(row)}, 2024</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
