"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Pagination, type PaginationProps } from "./Pagination";
import { QueryState } from "./QueryState";

export type AdminColumn = { key: string; label: string; className?: string };

export type AdminTableProps<T> = {
  columns: readonly AdminColumn[];
  rows: readonly T[];
  keyOf: (row: T) => string;
  /** One node per column, in column order. Columns with an empty label are treated as actions on cards. */
  cells: (row: T) => ReactNode[];
  /** Replaces the default stacked card below `md`. */
  card?: (row: T) => ReactNode;
  rowClassName?: (row: T) => string | undefined;
  toolbar?: ReactNode;
  pagination?: PaginationProps;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  empty: { icon: LucideIcon; title: string; description?: string };
};

/** Responsive list: a real `<table>` on `md+`, stacked cards below. */
export function AdminTable<T>({ columns, rows, keyOf, cells, card, rowClassName, toolbar, pagination, isLoading, isError, onRetry, empty }: AdminTableProps<T>) {
  return (
    <div>
      {toolbar && <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{toolbar}</div>}
      <QueryState isLoading={isLoading} isError={isError} onRetry={onRetry} isEmpty={rows.length === 0} empty={empty}>
        <div className="hidden overflow-x-auto rounded-3xl border border-border bg-white md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} scope="col" className={cn("px-4 py-3 font-semibold", column.className)}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={keyOf(row)} className={cn("border-t border-border align-middle", rowClassName?.(row))}>
                  {cells(row).map((cell, index) => (
                    <td key={columns[index]?.key ?? index} className={cn("px-4 py-3", columns[index]?.className)}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {rows.map((row) => (
            <li key={keyOf(row)} className={cn("rounded-2xl border border-border bg-white p-4", rowClassName?.(row))}>
              {card ? card(row) : <DefaultCard columns={columns} cells={cells(row)} />}
            </li>
          ))}
        </ul>
      </QueryState>
      {pagination && rows.length > 0 && <Pagination {...pagination} />}
    </div>
  );
}

function DefaultCard({ columns, cells }: { columns: readonly AdminColumn[]; cells: ReactNode[] }) {
  const fields = columns.map((column, index) => ({ column, cell: cells[index] }));
  const labelled = fields.filter(({ column }) => column.label);
  const actions = fields.filter(({ column }) => !column.label);
  return (
    <div className="space-y-2">
      <dl className="space-y-2">
        {labelled.map(({ column, cell }) => (
          <div key={column.key} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <dt className="text-[11px] font-semibold text-muted-foreground uppercase">{column.label}</dt>
            <dd className="min-w-0 text-right text-sm">{cell}</dd>
          </div>
        ))}
      </dl>
      {actions.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          {actions.map(({ column, cell }) => (
            <div key={column.key}>{cell}</div>
          ))}
        </div>
      )}
    </div>
  );
}
