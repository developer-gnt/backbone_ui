import React from "react";

interface CustomPricingListProps {
  overrides: Array<{
    id: number;
    clientName: string;
    clientUsername: string | null;
    packageTitle: string | null;
    packageDuration: string | null;
    customPrice: number | null;
    customCredit: number | null;
    isActive: boolean;
    notes: string | null;
    createdDate?: string;
    modifyDate?: string;
  }>;
}

export default function CustomPricingList({ overrides }: CustomPricingListProps) {
  if (!overrides.length) return null;
  return (
    <div className="mt-10">
      <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">Custom Pricing Clients</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-dark-2">
              <th className="p-2">Client</th>
              <th className="p-2">Username/Email</th>
              <th className="p-2">Package</th>
              <th className="p-2">Duration</th>
              <th className="p-2">Custom Price</th>
              <th className="p-2">Custom Credit</th>
              <th className="p-2">Active?</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {overrides.map((row) => (
              <tr key={row.id}>
                <td className="p-2">{row.clientName}</td>
                <td className="p-2">{row.clientUsername}</td>
                <td className="p-2">{row.packageTitle}</td>
                <td className="p-2">{row.packageDuration}</td>
                <td className="p-2">{row.customPrice ?? '-'}</td>
                <td className="p-2">{row.customCredit ?? '-'}</td>
                <td className="p-2">{row.isActive ? 'Yes' : 'No'}</td>
                <td className="p-2">{row.notes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
