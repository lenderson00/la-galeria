"use client"

import type React from "react"

import { useState, useRef } from "react"

export interface DragItem {
  id: string
  index: number
}

export function useDragAndDrop<T extends { id: string }>(items: T[], onReorder: (newOrder: T[]) => void) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragCounter = useRef(0)

  const handleDragStart = (e: React.DragEvent, item: T, index: number) => {
    setDraggedItem({ id: item.id, index })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", item.id)

    // Add some visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    setDragOverIndex(null)
    dragCounter.current = 0

    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    if (draggedItem && draggedItem.index !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragCounter.current++
    setDragOverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!draggedItem || draggedItem.index === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    const newItems = [...items]
    const draggedItemData = newItems[draggedItem.index]

    // Remove dragged item from its original position
    newItems.splice(draggedItem.index, 1)

    // Insert dragged item at new position
    newItems.splice(dropIndex, 0, draggedItemData)

    onReorder(newItems)
    setDraggedItem(null)
    setDragOverIndex(null)
    dragCounter.current = 0
  }

  return {
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  }
}
