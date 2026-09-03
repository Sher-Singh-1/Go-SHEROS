"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderTasks } from "@/app/dashboard/tasks/actions";
import { TaskRow, type TaskRowData } from "./task-row";

function SortableRow({ task }: { task: TaskRowData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "z-10 opacity-70" : undefined}
    >
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="flex h-8 w-5 flex-none cursor-grab touch-none items-center justify-center text-ink-faint active:cursor-grabbing"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
            <circle cx="6" cy="5" r="1.3" /><circle cx="6" cy="10" r="1.3" /><circle cx="6" cy="15" r="1.3" />
            <circle cx="12" cy="5" r="1.3" /><circle cx="12" cy="10" r="1.3" /><circle cx="12" cy="15" r="1.3" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <TaskRow task={task} />
        </div>
      </div>
    </div>
  );
}

export function SortableTaskList({ initialTasks }: { initialTasks: TaskRowData[] }) {
  // initialTasks is a fresh array every server render, so a plain useState
  // initializer only captures it once — without resyncing here, a status
  // change (e.g. completing a task) persists to the DB but never appears
  // until a full page reload, since router.refresh() alone can't reach this
  // local state. Adjusting state during render (React's documented pattern
  // for this, in place of an effect) avoids the extra render an effect
  // would cost.
  const signature = initialTasks.map((t) => `${t.id}:${t.status}:${t.priority}`).join(",");
  const [tasks, setTasks] = useState(initialTasks);
  const [prevSignature, setPrevSignature] = useState(signature);
  if (signature !== prevSignature) {
    setPrevSignature(signature);
    setTasks(initialTasks);
  }

  const [, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(async () => {
        await reorderTasks(next.map((t) => t.id));
        router.refresh();
      });
      return next;
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong p-10 text-center text-sm text-ink-soft">
        Nothing scheduled for this day.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <SortableRow key={t.id} task={t} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
