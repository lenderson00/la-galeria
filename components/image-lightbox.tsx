"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Download,
  RotateCcw,
  RotateCw,
  Rotate3dIcon as RotateIcon,
  Save,
} from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import type { Image as ImageType } from "@/lib/db/schema"
import { rotateAndSaveImage } from "@/lib/actions"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { ToastContainer } from "@/components/toast"
import { useRouter } from "next/navigation"

interface ImageLightboxProps {
  open: boolean
  onClose: () => void
  images: ImageType[]
  initialIndex: number
}

export function ImageLightbox({ open, onClose, images, initialIndex }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isRotating, setIsRotating] = useState(false)
  const [hasUnsavedRotation, setHasUnsavedRotation] = useState(false)
  const { toasts, showToast, removeToast } = useToastFeedback()
  const router = useRouter()

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    setHasUnsavedRotation(false)
  }, [initialIndex, open])

  const handleSaveRotation = useCallback(async () => {
    if (!hasUnsavedRotation || rotation === 0) {
      showToast("Nenhuma rotação para salvar", "error")
      return
    }

    const currentImage = images[currentIndex]
    if (!currentImage) return

    console.log("Iniciando salvamento da rotação:", { rotation, imageId: currentImage.id })

    setIsRotating(true)
    try {
      const result = await rotateAndSaveImage(currentImage.id, rotation)

      console.log("Resultado do salvamento:", result)

      if (result?.error) {
        console.error("Erro retornado:", result.error)
        showToast(result.error, "error")
      } else if (result?.success) {
        showToast(result.message || "Imagem rotacionada e salva com sucesso!", "success")
        setHasUnsavedRotation(false)
        setRotation(0)
        setPosition({ x: 0, y: 0 })

        setTimeout(() => {
          console.log("Atualizando dados da página com router.refresh()")
          router.refresh()
        }, 2000)
      } else {
        showToast("Resposta inesperada do servidor", "error")
      }
    } catch (error) {
      console.error("Erro ao rotacionar imagem:", error)
      showToast("Erro inesperado ao rotacionar imagem", "error")
    } finally {
      setIsRotating(false)
    }
  }, [hasUnsavedRotation, rotation, images, currentIndex, showToast, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "ArrowLeft":
          goToPrevious()
          break
        case "ArrowRight":
          goToNext()
          break
        case "Escape":
          onClose()
          break
        case "+":
        case "=":
          handleZoomIn()
          break
        case "-":
          handleZoomOut()
          break
        case "r":
        case "R":
          handleRotateClockwise()
          break
        case "l":
        case "L":
          handleRotateCounterClockwise()
          break
        case "s":
        case "S":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleSaveRotation()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, currentIndex, hasUnsavedRotation, handleSaveRotation])

  const goToPrevious = () => {
    if (hasUnsavedRotation) {
      showToast("Salve a rotação antes de navegar", "error")
      return
    }
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    resetTransforms()
  }

  const goToNext = () => {
    if (hasUnsavedRotation) {
      showToast("Salve a rotação antes de navegar", "error")
      return
    }
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    resetTransforms()
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5))
  }

  const handleRotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360)
    setPosition({ x: 0, y: 0 })
    setHasUnsavedRotation(true)
  }

  const handleRotateCounterClockwise = () => {
    setRotation((prev) => (prev - 90 + 360) % 360)
    setPosition({ x: 0, y: 0 })
    setHasUnsavedRotation(true)
  }

  const resetTransforms = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    setHasUnsavedRotation(false)
  }

  const resetRotation = () => {
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    setHasUnsavedRotation(rotation !== 0)
  }

  const handleDownload = async () => {
    const currentImage = images[currentIndex]
    if (!currentImage) return

    try {
      const response = await fetch(currentImage.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `image-${currentIndex + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao baixar imagem:", error)
    }
  }

  const handleClose = () => {
    if (hasUnsavedRotation) {
      showToast("Você tem rotações não salvas. Salve antes de fechar.", "error")
      return
    }
    onClose()
  }

  if (!images.length) return null

  const currentImage = images[currentIndex]

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Controles superiores */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {currentIndex + 1} de {images.length}
                </span>
                {rotation !== 0 && (
                  <span
                    className={`text-white text-sm px-3 py-1 rounded-full flex items-center ${
                      hasUnsavedRotation ? "bg-orange-500/80" : "bg-black/50"
                    }`}
                  >
                    <RotateIcon className="h-3 w-3 mr-1" />
                    {rotation}°{hasUnsavedRotation && <span className="ml-1">*</span>}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Controles de rotação */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateCounterClockwise}
                  className="text-white hover:bg-white/20"
                  title="Rotacionar anti-horário (L)"
                  disabled={isRotating}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetRotation}
                  className="text-white hover:bg-white/20"
                  title="Resetar rotação"
                  disabled={rotation === 0 || isRotating}
                >
                  <RotateIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateClockwise}
                  className="text-white hover:bg-white/20"
                  title="Rotacionar horário (R)"
                  disabled={isRotating}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>

                {/* Botão de salvar rotação */}
                {hasUnsavedRotation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveRotation}
                    className="text-white hover:bg-green-500/20 bg-green-500/10 border border-green-500/30"
                    title="Salvar rotação permanentemente (Ctrl+S)"
                    disabled={isRotating}
                  >
                    {isRotating ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                )}

                {/* Separador visual */}
                <div className="w-px h-6 bg-white/30 mx-1" />

                {/* Controles de zoom */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="text-white hover:bg-white/20"
                  disabled={zoom <= 0.5}
                  title="Diminuir zoom (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTransforms}
                  className="text-white hover:bg-white/20"
                  title="Resetar zoom e rotação"
                >
                  {Math.round(zoom * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="text-white hover:bg-white/20"
                  disabled={zoom >= 5}
                  title="Aumentar zoom (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                {/* Separador visual */}
                <div className="w-px h-6 bg-white/30 mx-1" />

                {/* Controles de ação */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                  title="Baixar imagem"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20"
                  title="Fechar (Esc)"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Aviso de rotação não salva */}
            {hasUnsavedRotation && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-orange-500/90 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 z-40">
                <Save className="h-4 w-4" />
                <span>Rotação não salva - Clique em salvar para aplicar permanentemente</span>
              </div>
            )}

            {/* Imagem principal */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <div
                className="relative transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
                onMouseDown={(e) => {
                  if (zoom <= 1) return
                  const startX = e.clientX - position.x
                  const startY = e.clientY - position.y

                  const handleMouseMove = (e: MouseEvent) => {
                    setPosition({
                      x: e.clientX - startX,
                      y: e.clientY - startY,
                    })
                  }

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove)
                    document.removeEventListener("mouseup", handleMouseUp)
                  }

                  document.addEventListener("mousemove", handleMouseMove)
                  document.addEventListener("mouseup", handleMouseUp)
                }}
              >
                <Image
                  src={currentImage.url || "/placeholder.svg"}
                  alt={`Imagem ${currentIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-[90vw] max-h-[80vh] object-contain"
                  priority
                  draggable={false}
                />
              </div>
            </div>

            {/* Navegação lateral */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  title="Imagem anterior (←)"
                  disabled={hasUnsavedRotation}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  title="Próxima imagem (→)"
                  disabled={hasUnsavedRotation}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Instruções de teclado */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-black/30 px-3 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
              Use ←/→ para navegar, R/L para rotacionar, Ctrl+S para salvar, +/- para zoom
            </div>

            {/* Miniaturas na parte inferior */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/50 p-2 rounded-lg max-w-[90vw] overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      if (hasUnsavedRotation) {
                        showToast("Salve a rotação antes de navegar", "error")
                        return
                      }
                      setCurrentIndex(index)
                      resetTransforms()
                    }}
                    className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      index === currentIndex ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
                    } ${hasUnsavedRotation && index !== currentIndex ? "opacity-30 cursor-not-allowed" : ""}`}
                    title={`Ir para imagem ${index + 1}`}
                    disabled={hasUnsavedRotation && index !== currentIndex}
                  >
                    <Image
                      src={image.url || "/placeholder.svg"}
                      alt={`Miniatura ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
