'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import Avatar from '@/components/shared/Avatar'
import type { DealStage, Deal } from '@/types'

function KanbanCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal', deal },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const contactName = deal.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name}`
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="card p-3 cursor-grab active:cursor-grabbing hover:border-[var(--accent)] transition-colors mb-2"
    >
      <Link href={`/deals/${deal.id}`} className="block" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-medium mb-1">{deal.title}</p>
        <p className="text-lg font-bold" style={{ color: 'var(--accent-light)' }}>
          {formatCurrency(deal.amount ?? 0)}
        </p>
        <div className="flex items-center justify-between mt-2">
          {contactName && (
            <div className="flex items-center gap-1.5">
              <Avatar name={contactName} size="sm" />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{contactName}</span>
            </div>
          )}
          {deal.close_date && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(deal.close_date)}</span>
          )}
        </div>
      </Link>
    </div>
  )
}

function KanbanColumn({ stage, deals }: { stage: DealStage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  const totalAmount = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0)

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-w-[280px] max-w-[320px] rounded-xl p-3"
      style={{
        background: isOver ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: stage.color }} />
          <span className="text-sm font-semibold">{stage.name}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            {deals.length}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {formatCurrency(totalAmount)}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-0 min-h-[100px]">
        {deals.map(deal => (
          <KanbanCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard({
  stages,
  deals: initialDeals,
}: {
  stages: DealStage[]
  deals: Deal[]
}) {
  const [deals, setDeals] = useState(initialDeals)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const dealId = active.id as string
      const newStageId = over.id as string

      // Check if dropped over a column (stage)
      const isStage = stages.some(s => s.id === newStageId)
      if (!isStage) return

      const deal = deals.find(d => d.id === dealId)
      if (!deal || deal.stage_id === newStageId) return

      // Optimistic update
      setDeals(prev =>
        prev.map(d => (d.id === dealId ? { ...d, stage_id: newStageId } : d))
      )

      // Persist
      await supabase
        .from('deals')
        .update({ stage_id: newStageId })
        .eq('id', dealId)
    },
    [deals, stages, supabase]
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals.filter(d => d.stage_id === stage.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}
