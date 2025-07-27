"use client"

import type { Project } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, ImageIcon, Trash2, MoreVertical } from "lucide-react"
import { deleteProject } from "@/lib/actions"
import { useState } from "react"
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

interface ProjectGridProps {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set())

  const handleDelete = async (projectId: string) => {
    setDeletingProjects((prev) => new Set(prev).add(projectId))

    try {
      const result = await deleteProject(projectId)
      if (result?.error) {
        console.error("Erro ao deletar:", result.error)
      }
    } catch (error) {
      console.error("Erro ao deletar projeto:", error)
    } finally {
      setDeletingProjects((prev) => {
        const newSet = new Set(prev)
        newSet.delete(projectId)
        return newSet
      })
    }
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum projeto</h3>
        <p className="mt-1 text-sm text-gray-500">Comece criando seu primeiro projeto de galeria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/project/${project.id}`}>Ver Projeto</Link>
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onSelect={(e) => e.preventDefault()}
                        disabled={deletingProjects.has(project.id)}
                      >
                        {deletingProjects.has(project.id) ? (
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
                          permanentemente. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(project.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Deletar Projeto
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(project.createdAt!).toLocaleDateString("pt-BR")}
              </div>
              <Button asChild size="sm">
                <Link href={`/project/${project.id}`}>Ver Projeto</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
