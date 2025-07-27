"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createProject } from "@/lib/actions"
import { Plus } from "lucide-react"

type ProjectForm = {
  name: string
  description: string
}

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProjectForm>()

  const onSubmit = async (data: ProjectForm) => {
    setError(null)
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("description", data.description)

    const result = await createProject(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input id="name" {...register("name", { required: true })} placeholder="Ex: Projeto Casa Moderna" />
          </div>
          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" {...register("description")} placeholder="Descreva seu projeto..." rows={3} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Projeto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
