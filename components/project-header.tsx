"use client"

import { Button } from "@/components/ui/button"
import type { Project } from "@/lib/db/schema"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Trash2, MoreVertical, Copy } from "lucide-react"
import { deleteProject, getCoverImage } from "@/lib/actions"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { ToastContainer } from "@/components/toast"
import Image from "next/image"

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [deleting, setDeleting] = useState(false)
  const [coverImage, setCoverImage] = useState<any>(null)
  const [copying, setCopying] = useState(false)
  const router = useRouter()
  const { toasts, showToast, removeToast } = useToastFeedback()

  useEffect(() => {
    const loadCoverImage = async () => {
      const cover = await getCoverImage(project.id)
      setCoverImage(cover)
    }
    loadCoverImage()
  }, [project.id])

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const result = await deleteProject(project.id)
      if (result?.error) {
        console.error("Erro ao deletar:", result.error)
        showToast("Erro ao deletar projeto", "error")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Erro ao deletar projeto:", error)
      showToast("Erro ao deletar projeto", "error")
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyCoverLink = async () => {
    if (!coverImage) {
      showToast("Nenhuma foto de capa selecionada", "error")
      return
    }

    setCopying(true)
    try {
      await navigator.clipboard.writeText(coverImage.url)
      showToast("Link da foto de capa copiado!", "success")
    } catch (error) {
      showToast("Erro ao copiar link", "error")
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <div className="flex items-center space-x-4">
                {coverImage && (
                  <div className="relative">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500 shadow-md">
                      <Image
                        src={coverImage.url || "/placeholder.svg"}
                        alt="Foto de capa"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      Capa
                    </div>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  {project.description && <p className="text-sm text-gray-600">{project.description}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {coverImage && (
                <Button onClick={handleCopyCoverLink} disabled={copying} size="sm">
                  {copying ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copiar Link da Capa
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={`/api/project/${project.id}/images`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  API Pública
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onSelect={(e) => e.preventDefault()}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <div className="flex items-center">
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                            Deletando...
                          </div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar Projeto
                          </>
                        )}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deletar projeto</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja deletar o projeto "{project.name}"? Todas as imagens serão removidas
                          permanentemente do banco de dados e do CDN. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                          Deletar Projeto
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
