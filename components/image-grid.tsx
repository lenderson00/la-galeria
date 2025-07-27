"use client"

import type { Image as ImageType } from "@/lib/db/schema"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Trash2, Star, StarOff, Copy, GripVertical } from "lucide-react"
import { deleteImage, setCoverImage, removeCoverImage, getCoverImage, reorderImages } from "@/lib/actions"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { ToastContainer } from "@/components/toast"
import { useDragAndDrop } from "@/hooks/use-drag-and-drop"
import { ImageLightbox } from "./image-lightbox"

interface ImageGridProps {
  images: ImageType[]
  projectId: string
}

export function ImageGrid({ images, projectId }: ImageGridProps) {
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set())
  const [coverImageId, setCoverImageId] = useState<string | null>(null)
  const [settingCover, setSettingCover] = useState<Set<string>>(new Set())
  const [copyingImages, setCopyingImages] = useState<Set<string>>(new Set())
  const [reordering, setReordering] = useState(false)
  const [localImages, setLocalImages] = useState<ImageType[]>(images)
  const { toasts, showToast, removeToast } = useToastFeedback()

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Update local images when props change
  useEffect(() => {
    setLocalImages(images)
  }, [images])

  useEffect(() => {
    const loadCoverImage = async () => {
      try {
        const cover = await getCoverImage(projectId)
        setCoverImageId(cover?.id || null)
      } catch (error) {
        console.error("Erro ao carregar foto de capa:", error)
      }
    }
    loadCoverImage()
  }, [projectId])

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setLightboxOpen(true)
  }

  const handleReorder = async (newOrder: ImageType[]) => {
    setLocalImages(newOrder)
    setReordering(true)

    try {
      const imageIds = newOrder.map((img) => img.id)
      const result = await reorderImages(projectId, imageIds)

      if (result?.error) {
        showToast(result.error, "error")
        // Revert to original order on error
        setLocalImages(images)
      } else {
        showToast("Ordem das imagens atualizada", "success")
      }
    } catch (error) {
      console.error("Erro ao reordenar:", error)
      showToast("Erro ao reordenar imagens", "error")
      // Revert to original order on error
      setLocalImages(images)
    } finally {
      setReordering(false)
    }
  }

  const {
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(localImages, handleReorder)

  const handleDelete = async (imageId: string) => {
    setDeletingImages((prev) => new Set(prev).add(imageId))

    try {
      const result = await deleteImage(imageId)
      if (result?.error) {
        console.error("Erro ao deletar:", result.error)
        showToast(result.error, "error")
      } else {
        showToast("Imagem deletada com sucesso", "success")
        // If deleted image was cover, update state
        if (imageId === coverImageId) {
          setCoverImageId(null)
        }
      }
    } catch (error) {
      console.error("Erro ao deletar imagem:", error)
      showToast("Erro inesperado ao deletar imagem", "error")
    } finally {
      setDeletingImages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }

  const handleSetCover = async (imageId: string) => {
    setSettingCover((prev) => new Set(prev).add(imageId))

    try {
      const result = await setCoverImage(projectId, imageId)
      if (result?.error) {
        showToast(result.error, "error")
      } else {
        setCoverImageId(imageId)
        showToast("Foto de capa definida com sucesso", "success")
      }
    } catch (error) {
      console.error("Erro ao definir capa:", error)
      showToast("Erro inesperado ao definir foto de capa", "error")
    } finally {
      setSettingCover((prev) => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }

  const handleRemoveCover = async () => {
    if (!coverImageId) return

    setSettingCover((prev) => new Set(prev).add(coverImageId))

    try {
      const result = await removeCoverImage(projectId)
      if (result?.error) {
        showToast(result.error, "error")
      } else {
        setCoverImageId(null)
        showToast("Foto de capa removida", "success")
      }
    } catch (error) {
      console.error("Erro ao remover capa:", error)
      showToast("Erro inesperado ao remover foto de capa", "error")
    } finally {
      setSettingCover((prev) => {
        const newSet = new Set(prev)
        newSet.delete(coverImageId)
        return newSet
      })
    }
  }

  const handleCopyLink = async (imageUrl: string, imageId: string) => {
    setCopyingImages((prev) => new Set(prev).add(imageId))

    try {
      await navigator.clipboard.writeText(imageUrl)
      showToast("Link da imagem copiado!", "success")
    } catch (error) {
      console.error("Erro ao copiar link:", error)
      showToast("Erro ao copiar link", "error")
    } finally {
      setCopyingImages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    }
  }

  if (localImages.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhuma imagem</h3>
          <p className="text-gray-500">Faça upload das primeiras imagens do seu projeto.</p>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  return (
    <>
      {reordering && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm text-blue-700">Atualizando ordem das imagens...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {localImages.map((image, index) => {
          const isCover = image.id === coverImageId
          const isDragging = draggedItem?.id === image.id
          const isDragOver = dragOverIndex === index

          return (
            <div
              key={image.id}
              draggable
              onDragStart={(e) => handleDragStart(e, image, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-move transition-all duration-200 ${
                isCover ? "ring-4 ring-blue-500 ring-offset-2" : ""
              } ${isDragging ? "opacity-50 scale-95 rotate-2" : ""} ${
                isDragOver ? "ring-2 ring-green-400 ring-offset-2 scale-105" : ""
              }`}
            >
              <div className="w-full h-full cursor-pointer" onClick={() => openLightbox(index)}>
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt="Project image"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  draggable={false}
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all pointer-events-none" />

              {/* Drag handle */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded p-1">
                  <GripVertical className="h-4 w-4 text-gray-600" />
                </div>
              </div>

              {/* Cover indicator */}
              {isCover && (
                <div className="absolute top-2 left-10 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Foto de Capa
                </div>
              )}

              {/* Drag over indicator */}
              {isDragOver && (
                <div className="absolute inset-0 bg-green-400 bg-opacity-20 border-2 border-green-400 border-dashed rounded-lg flex items-center justify-center">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">Soltar aqui</div>
                </div>
              )}

              {/* Action buttons */}
              <div
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Copy link button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={() => handleCopyLink(image.url, image.id)}
                  disabled={copyingImages.has(image.id)}
                  title="Copiar link da imagem"
                >
                  {copyingImages.has(image.id) ? (
                    <div className="h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                {/* Cover toggle button */}
                <Button
                  size="sm"
                  variant={isCover ? "default" : "secondary"}
                  className="h-8 w-8 p-0"
                  onClick={isCover ? handleRemoveCover : () => handleSetCover(image.id)}
                  disabled={settingCover.has(image.id)}
                  title={isCover ? "Remover como capa" : "Definir como capa"}
                >
                  {settingCover.has(image.id) ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isCover ? (
                    <StarOff className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </Button>

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      disabled={deletingImages.has(image.id)}
                      title="Deletar imagem"
                    >
                      {deletingImages.has(image.id) ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deletar imagem</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita.
                        {isCover && " Esta imagem é a foto de capa do projeto."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(image.id)} className="bg-red-600 hover:bg-red-700">
                        Deletar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={localImages}
        initialIndex={selectedIndex}
      />
    </>
  )
}
