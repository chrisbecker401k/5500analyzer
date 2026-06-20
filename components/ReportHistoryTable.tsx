"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Archive, Download, Eye, FileDown, MoreHorizontal, type LucideIcon } from "lucide-react";
import { historyRows } from "@/data/mockData";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export function ReportHistoryTable() {
  const actions: Array<[string, LucideIcon]> = [
    ["View PDF", Eye],
    ["Download DOCX", FileDown],
    ["Open Details", Download],
    ["Archive Report", Archive]
  ];

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-white text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-6 py-4 font-semibold">Company</th>
            <th className="px-4 py-4 font-semibold">Plan Year</th>
            <th className="px-4 py-4 font-semibold">Assets</th>
            <th className="px-4 py-4 font-semibold">Participants</th>
            <th className="px-4 py-4 font-semibold">Status</th>
            <th className="px-4 py-4 font-semibold">Generated On</th>
            <th className="px-6 py-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {historyRows.map((row, index) => (
            <tr key={row.id} className="border-b border-slate-100 last:border-0">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-everhart-blue text-xs font-bold text-white">
                    {row.companyName.split(" ").map((word) => word[0]).join("").slice(0, 2)}
                  </span>
                  <span className="font-medium text-slate-900">{row.companyName}</span>
                </div>
              </td>
              <td className="px-4 py-4">{row.planYear}</td>
              <td className="px-4 py-4">{formatCurrency(row.endingAssets)}</td>
              <td className="px-4 py-4">{formatNumber(row.participantsWithBalances)}</td>
              <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
              <td className="px-4 py-4">May {20 - Math.min(index, 9)}, 2024</td>
              <td className="px-6 py-4 text-right">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger className="rounded-md p-2 hover:bg-slate-100" aria-label="Open report actions">
                    <MoreHorizontal className="h-5 w-5" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" className="z-50 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
                      {actions.map(([label, Icon]) => (
                        <DropdownMenu.Item key={label} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm outline-none hover:bg-slate-50">
                          <Icon className="h-4 w-4 text-slate-500" />
                          {label}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
        <span>Showing 1 to 10 of 87 reports</span>
        <span className="font-semibold text-everhart-blue">1&nbsp;&nbsp; 2&nbsp;&nbsp; 3&nbsp;&nbsp; ...&nbsp;&nbsp; 9</span>
      </div>
    </div>
  );
}
