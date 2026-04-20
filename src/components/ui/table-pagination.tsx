"use client";

import React from "react";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  label?: string;
};

const buildPageItems = (page: number, totalPages: number) => {
  const items: Array<number | string> = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) {
    items.push(1);
  }

  if (start > 2) {
    items.push("start-ellipsis");
  }

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (end < totalPages - 1) {
    items.push("end-ellipsis");
  }

  if (end < totalPages) {
    items.push(totalPages);
  }

  return items;
};

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  label = "rows",
}: TablePaginationProps) {
  if (totalItems <= itemsPerPage) {
    return null;
  }

  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);
  const pageItems = buildPageItems(page, totalPages);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-stroke px-4 py-3 text-sm dark:border-dark-3 md:flex-row md:items-center md:justify-between">
      <p className="text-dark-5">
        Showing <span className="font-medium text-dark dark:text-white">{startItem}</span>
        {" "}to <span className="font-medium text-dark dark:text-white">{endItem}</span>{" "}
        of <span className="font-medium text-dark dark:text-white">{totalItems}</span>{" "}
        {label}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-stroke px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3"
        >
          Previous
        </button>

        {pageItems.map((item, index) =>
          typeof item === "number" ? (
            <button
              key={`${item}-${index}`}
              onClick={() => onPageChange(item)}
              className={`rounded-md px-3 py-1.5 ${
                item === page
                  ? "bg-primary text-white"
                  : "border border-stroke hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
              }`}
            >
              {item}
            </button>
          ) : (
            <span key={`${item}-${index}`} className="px-1 text-dark-5">
              ...
            </span>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-stroke px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3"
        >
          Next
        </button>
      </div>
    </div>
  );
}
