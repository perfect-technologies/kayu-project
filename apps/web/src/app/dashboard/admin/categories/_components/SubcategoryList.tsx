"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
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
import {
  PersistedSubcategory,
  SubcategoryDraftValues,
  SubcategoryRow,
} from "./SubcategoryRow";

type Props = {
  subcategories: PersistedSubcategory[];
  pendingSaveId: string | null;
  pendingDeleteId: string | null;
  rowSaveErrors: Record<string, string | null>;
  rowDeleteErrors: Record<string, string | null>;
  isCreating: boolean;
  draftSaveError: string | null;
  onCreate: (values: SubcategoryDraftValues, onDone: () => void) => void;
  onUpdate: (id: string, values: SubcategoryDraftValues) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
};

export function SubcategoryList({
  subcategories,
  pendingSaveId,
  pendingDeleteId,
  rowSaveErrors,
  rowDeleteErrors,
  isCreating,
  draftSaveError,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: Props) {
  const [draftOpen, setDraftOpen] = React.useState(false);

  // Local order — kept in sync with props but reorderable via DnD before the
  // server confirms the new positions. This avoids snap-back during the
  // round-trip.
  const [localIds, setLocalIds] = React.useState<string[]>(() =>
    subcategories.map((s) => s.id),
  );

  React.useEffect(() => {
    setLocalIds(subcategories.map((s) => s.id));
  }, [subcategories]);

  const byId = React.useMemo(() => {
    const map = new Map<string, PersistedSubcategory>();
    for (const sub of subcategories) map.set(sub.id, sub);
    return map;
  }, [subcategories]);

  const ordered = localIds
    .map((id) => byId.get(id))
    .filter((sub): sub is PersistedSubcategory => Boolean(sub));

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
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--k-text-primary)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Sous-catégories
        </h3>
        <button
          type="button"
          onClick={() => setDraftOpen(true)}
          disabled={draftOpen}
          className="inline-flex items-center gap-1.5"
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            background: "var(--k-primary)",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            opacity: draftOpen ? 0.6 : 1,
            cursor: draftOpen ? "not-allowed" : "pointer",
            height: 28,
          }}
        >
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {draftOpen ? (
        <SubcategoryRow
          mode="draft"
          isSaving={isCreating}
          saveError={draftSaveError}
          onCancel={() => setDraftOpen(false)}
          onSave={(values) => onCreate(values, () => setDraftOpen(false))}
        />
      ) : null}

      {ordered.length === 0 && !draftOpen ? (
        <div
          style={{
            padding: "20px 12px",
            textAlign: "center",
            border: "1px dashed var(--k-border)",
            borderRadius: 8,
            color: "var(--k-text-muted)",
            fontSize: 12.5,
          }}
        >
          Aucune sous-catégorie pour le moment.
          <button
            type="button"
            onClick={() => setDraftOpen(true)}
            style={{
              display: "block",
              margin: "8px auto 0",
              padding: "6px 10px",
              border: "1px solid var(--k-border)",
              borderRadius: 6,
              background: "white",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            + Ajouter une sous-catégorie
          </button>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localIds} strategy={verticalListSortingStrategy}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ordered.map((sub) => (
              <SortableSubcategory
                key={sub.id}
                sub={sub}
                isSaving={pendingSaveId === sub.id}
                isDeleting={pendingDeleteId === sub.id}
                saveError={rowSaveErrors[sub.id] ?? null}
                deleteError={rowDeleteErrors[sub.id] ?? null}
                onSave={(values) => onUpdate(sub.id, values)}
                onDelete={() => onDelete(sub.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableSubcategory({
  sub,
  isSaving,
  isDeleting,
  saveError,
  deleteError,
  onSave,
  onDelete,
}: {
  sub: PersistedSubcategory;
  isSaving: boolean;
  isDeleting: boolean;
  saveError: string | null;
  deleteError: string | null;
  onSave: (values: SubcategoryDraftValues) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sub.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SubcategoryRow
        mode="persisted"
        initialValues={sub}
        isSaving={isSaving}
        isDeleting={isDeleting}
        saveError={saveError}
        deleteError={deleteError}
        onSave={onSave}
        onDelete={onDelete}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes as unknown as Record<string, unknown>}
        listeners={listeners as unknown as Record<string, unknown>}
      />
    </div>
  );
}
