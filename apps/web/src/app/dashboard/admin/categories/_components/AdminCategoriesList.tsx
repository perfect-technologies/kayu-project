"use client";

import * as React from "react";
import Link from "next/link";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LucideIconView } from "./LucideIcon";

export type AdminCategoryListItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  providerCount?: number | null;
  subcategoryCount?: number | null;
  stats?: {
    providerCount?: number | null;
    subcategoryCount?: number | null;
  } | null;
};

type Props = {
  categories: AdminCategoryListItem[];
  onDelete: (target: { id: string; name: string }) => void;
  onReorder: (orderedIds: string[]) => void;
};

export function AdminCategoriesList({ categories, onDelete, onReorder }: Props) {
  const [localIds, setLocalIds] = React.useState<string[]>(() =>
    categories.map((c) => c.id),
  );

  React.useEffect(() => {
    setLocalIds(categories.map((c) => c.id));
  }, [categories]);

  const byId = React.useMemo(() => {
    const map = new Map<string, AdminCategoryListItem>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const ordered = localIds
    .map((id) => byId.get(id))
    .filter((c): c is AdminCategoryListItem => Boolean(c));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localIds.indexOf(String(active.id));
    const newIndex = localIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(localIds, oldIndex, newIndex);
    setLocalIds(next);
    onReorder(next);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={localIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ordered.map((c) => (
            <SortableRow key={c.id} category={c} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  category,
  onDelete,
}: {
  category: AdminCategoryListItem;
  onDelete: (target: { id: string; name: string }) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : "auto",
  };

  const providerCount =
    category.providerCount ?? category.stats?.providerCount ?? 0;
  const subcategoryCount =
    category.subcategoryCount ?? category.stats?.subcategoryCount ?? null;

  return (
    <div ref={setNodeRef} style={wrapperStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--k-surface)",
          border: "1px solid var(--k-border)",
          borderRadius: 10,
          padding: "8px 10px",
        }}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label="Réorganiser"
          title="Glisser pour réorganiser"
          {...attributes}
          {...listeners}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 28,
            border: "none",
            background: "transparent",
            color: "var(--k-text-subtle)",
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <GripVertical size={14} />
        </button>

        <Link
          href={`/dashboard/admin/categories/${category.id}`}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: category.color
                ? `${category.color}1A`
                : "var(--k-surface-muted)",
              color: category.color || "var(--k-text-muted)",
              border: "1px solid var(--k-border)",
            }}
          >
            <LucideIconView name={category.icon} size={16} />
          </span>
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              flex: 1,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: "var(--k-text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {category.name}
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: "var(--k-text-subtle)",
                fontFamily: "var(--k-font-mono)",
                marginTop: 1,
              }}
            >
              /{category.slug}
            </span>
          </span>
        </Link>

        <span
          style={{
            fontSize: 11.5,
            color: "var(--k-text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {providerCount} pros
          {subcategoryCount != null ? ` · ${subcategoryCount} sous` : ""}
        </span>

        <ActiveChip active={category.isActive !== false} />

        <Link
          href={`/dashboard/admin/categories/${category.id}`}
          aria-label="Modifier"
          title="Modifier"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            color: "var(--k-text-muted)",
          }}
        >
          <Pencil size={14} />
        </Link>
        <button
          type="button"
          onClick={() => onDelete({ id: category.id, name: category.name })}
          aria-label="Supprimer"
          title="Supprimer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            color: "var(--k-danger)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function ActiveChip({ active }: { active: boolean }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        background: active ? "var(--k-surface-emerald)" : "var(--k-surface-amber)",
        color: active ? "#047857" : "#92400E",
        border: `1px solid ${active ? "#A7F3D0" : "#FDE68A"}`,
      }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
