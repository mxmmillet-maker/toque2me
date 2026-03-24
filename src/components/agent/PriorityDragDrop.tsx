'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

interface Priority {
  id: string;
  label: string;
  icon: string;
}

const DEFAULT_PRIORITIES: Priority[] = [
  { id: 'durabilite', label: 'Durabilité', icon: '♻️' },
  { id: 'origine', label: 'Origine Europe', icon: '🇪🇺' },
  { id: 'sur_mesure', label: 'Sur-mesure', icon: '✂️' },
  { id: 'rapidite', label: 'Rapidité', icon: '⚡' },
  { id: 'budget', label: 'Budget', icon: '💰' },
];

interface SortableItemProps {
  priority: Priority;
  rank: number;
}

function SortableItem({ priority, rank }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: priority.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-lg border-neutral-400 z-10' : 'border-neutral-200 hover:border-neutral-300'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        rank === 1 ? 'bg-neutral-900 text-white' :
        rank === 2 ? 'bg-neutral-700 text-white' :
        rank === 3 ? 'bg-neutral-400 text-white' :
        'bg-neutral-100 text-neutral-500'
      }`}>
        {rank}
      </div>
      <span className="text-base">{priority.icon}</span>
      <span className="text-sm font-medium text-neutral-700 flex-1">{priority.label}</span>
      <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
      </svg>
    </motion.div>
  );
}

interface PriorityDragDropProps {
  onChange: (priorities: Record<string, number>) => void;
}

export function PriorityDragDrop({ onChange }: PriorityDragDropProps) {
  const [items, setItems] = useState(DEFAULT_PRIORITIES);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Rang 1 = poids 5, rang 5 = poids 1
    const weights: Record<string, number> = {};
    newItems.forEach((item, i) => {
      weights[item.id] = (5 - i) * 20; // 100, 80, 60, 40, 20
    });
    onChange(weights);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-700 mb-1">Vos priorités</h3>
      <p className="text-xs text-neutral-400 mb-4">Glissez pour réordonner — la première compte le plus</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            <div className="space-y-2">
              {items.map((item, i) => (
                <SortableItem key={item.id} priority={item} rank={i + 1} />
              ))}
            </div>
          </AnimatePresence>
        </SortableContext>
      </DndContext>
    </div>
  );
}
