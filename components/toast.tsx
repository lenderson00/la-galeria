"use client"

import { X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToastProps {
  id: string
  message: string
  type: "success" | "error"
  onRemove: (id: string) => void
}

export function Toast({ id, message, type, onRemove }: ToastProps) {
  return (
    <div
      className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === "success"
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
      ) : (
        <AlertCircle className="h-5 w-5 mr-3 text-red-600" />
      )}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2" onClick={() => onRemove(id)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: "success" | "error" }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} id={toast.id} message={toast.message} type={toast.type} onRemove={onRemove} />
      ))}
    </div>
  )
}
