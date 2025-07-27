"use server"

import { db } from "./db"
import { projects, images, users } from "./db/schema"
import { getUser, login as authLogin, logout as authLogout } from "./auth"
import { eq, asc } from "drizzle-orm"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

// make getUser available to consumers of this module
export { getUser }

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    // Vercel-provided URL for preview/production
    return `https://${process.env.VERCEL_URL}`
  }
  // Fallback for local development
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const user = await authLogin(username, password)

  if (!user) {
    return { error: "Credenciais inválidas" }
  }

  redirect("/dashboard")
}

export async function logoutAction() {
  await authLogout()
  redirect("/login")
}

export async function createProject(formData: FormData) {
  const user = await getUser()
  if (!user) {
    return { error: "Não autorizado" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name) {
    return { error: "Nome é obrigatório" }
  }

  const [project] = await db
    .insert(projects)
    .values({
      name,
      description,
      userId: user.id,
    })
    .returning()

  revalidatePath("/dashboard")
  return { success: true, project }
}

export async function getProjects() {
  const user = await getUser()
  if (!user) return []

  return await db.select().from(projects).where(eq(projects.userId, user.id))
}

export async function getProject(id: string) {
  const user = await getUser()
  if (!user) return null

  const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)

  if (!project[0] || project[0].userId !== user.id) return null

  return project[0]
}

export async function saveImageUrl(projectId: string, url: string) {
  const user = await getUser()
  if (!user) return { error: "Não autorizado" }

  // Verify project belongs to user
  const project = await getProject(projectId)
  if (!project) return { error: "Projeto não encontrado" }

  // Get the highest sort order for this project
  const existingImages = await db.select().from(images).where(eq(images.projectId, projectId))
  const maxSortOrder = existingImages.reduce((max, img) => Math.max(max, img.sortOrder || 0), 0)

  await db.insert(images).values({
    url,
    projectId,
    sortOrder: maxSortOrder + 1,
  })

  revalidatePath(`/project/${projectId}`)
  return { success: true }
}

export async function getProjectImages(projectId: string) {
  return await db
    .select()
    .from(images)
    .where(eq(images.projectId, projectId))
    .orderBy(asc(images.sortOrder), asc(images.createdAt))
}

export async function deleteImage(imageId: string) {
  const user = await getUser()
  if (!user) return { error: "Não autorizado" }

  try {
    // Get image details first
    const [image] = await db.select().from(images).where(eq(images.id, imageId)).limit(1)
    if (!image) return { error: "Imagem não encontrada" }

    // Verify user owns the project
    const project = await getProject(image.projectId)
    if (!project) return { error: "Projeto não encontrado" }

    // Extract filename from URL for Bunny CDN deletion
    let fileName = ""
    try {
      const url = new URL(image.url)
      const pathParts = url.pathname.split("/")
      fileName = pathParts[pathParts.length - 1]
    } catch (urlError) {
      console.error("Erro ao processar URL da imagem:", urlError)
      // Continue with database deletion even if URL parsing fails
    }

    // Try to delete from Bunny CDN first (but don't fail if it doesn't work)
    if (fileName) {
      try {
        const deleteUrl = `${getBaseUrl()}/api/upload`

        const formData = new FormData()
        formData.append("projectId", image.projectId)
        formData.append("fileName", fileName)

        const response = await fetch(deleteUrl, {
          method: "DELETE",
          body: formData,
        })

        if (!response.ok) {
          console.warn("Aviso: Não foi possível deletar do CDN, mas continuando com a deleção do banco")
        }
      } catch (cdnError) {
        console.warn("Aviso: Erro ao deletar do CDN:", cdnError)
        // Continue with database deletion
      }
    }

    // Delete from database (this should always work)
    await db.delete(images).where(eq(images.id, imageId))

    revalidatePath(`/project/${image.projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar imagem:", error)
    return { error: "Erro ao deletar imagem" }
  }
}

export async function deleteProject(projectId: string) {
  const user = await getUser()
  if (!user) return { error: "Não autorizado" }

  // Verify user owns the project
  const project = await getProject(projectId)
  if (!project) return { error: "Projeto não encontrado" }

  try {
    // Get all images from the project
    const projectImages = await db.select().from(images).where(eq(images.projectId, projectId))

    // Try to delete all images from Bunny CDN (but don't fail if it doesn't work)
    for (const image of projectImages) {
      try {
        const url = new URL(image.url)
        const pathParts = url.pathname.split("/")
        const fileName = pathParts[pathParts.length - 1]

        const deleteUrl = `${getBaseUrl()}/api/upload`

        const formData = new FormData()
        formData.append("projectId", projectId)
        formData.append("fileName", fileName)

        await fetch(deleteUrl, {
          method: "DELETE",
          body: formData,
        })
      } catch (error) {
        console.warn("Aviso: Erro ao deletar imagem do CDN:", error)
        // Continue with next image
      }
    }

    // Delete all images from database
    await db.delete(images).where(eq(images.projectId, projectId))

    // Delete the project
    await db.delete(projects).where(eq(projects.id, projectId))

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Erro ao deletar projeto:", error)
    return { error: "Erro ao deletar projeto" }
  }
}

// Seed user creation (run once)
export async function createSeedUser() {
  const existingUser = await db.select().from(users).where(eq(users.username, "lenderson")).limit(1)

  if (existingUser[0]) {
    return { message: "Usuário já existe" }
  }

  const hashedPassword = await bcrypt.hash("L@vi@2025", 10)

  await db.insert(users).values({
    username: "lenderson",
    password: hashedPassword,
  })

  return { message: "Usuário seed criado com sucesso" }
}

export async function setCoverImage(projectId: string, imageId: string) {
  const user = await getUser()
  if (!user) return { error: "Não autorizado" }

  // Verify user owns the project
  const project = await getProject(projectId)
  if (!project) return { error: "Projeto não encontrado" }

  // Verify image belongs to the project
  const [image] = await db.select().from(images).where(eq(images.id, imageId)).limit(1)
  if (!image || image.projectId !== projectId) {
    return { error: "Imagem não encontrada" }
  }

  // Update project with cover image
  await db.update(projects).set({ coverImageId: imageId }).where(eq(projects.id, projectId))

  revalidatePath(`/project/${projectId}`)
  return { success: true }
}

export async function removeCoverImage(projectId: string) {
  const user = await getUser()
  if (!user) return { error: "Não autorizado" }

  // Verify user owns the project
  const project = await getProject(projectId)
  if (!project) return { error: "Projeto não encontrado" }

  // Remove cover image
  await db.update(projects).set({ coverImageId: null }).where(eq(projects.id, projectId))

  revalidatePath(`/project/${projectId}`)
  return { success: true }
}

export async function getCoverImage(projectId: string) {
  const project = await getProject(projectId)
  if (!project || !project.coverImageId) return null

  const [coverImage] = await db.select().from(images).where(eq(images.id, project.coverImageId)).limit(1)
  return coverImage || null
}

export async function reorderImages(projectId: string, imageIds: string[]) {
  const user = await getUser()
  if (!user) return { error: "Não autorizado" }

  // Verify user owns the project
  const project = await getProject(projectId)
  if (!project) return { error: "Projeto não encontrado" }

  try {
    // Update sort order for each image
    for (let i = 0; i < imageIds.length; i++) {
      await db
        .update(images)
        .set({ sortOrder: i + 1 })
        .where(eq(images.id, imageIds[i]))
    }

    revalidatePath(`/project/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Erro ao reordenar imagens:", error)
    return { error: "Erro ao reordenar imagens" }
  }
}

// Adicionar a nova função no final do arquivo, antes da última chave

export async function rotateAndSaveImage(imageId: string, rotation: number) {
  const user = await getUser()
  if (!user) return { error: "Não autorizado" }

  try {
    // Buscar a imagem no banco
    const [image] = await db.select().from(images).where(eq(images.id, imageId)).limit(1)
    if (!image) return { error: "Imagem não encontrada" }

    // Verificar se o usuário é dono do projeto
    const project = await getProject(image.projectId)
    if (!project) return { error: "Projeto não encontrado" }

    console.log("Iniciando rotação da imagem:", { imageId, rotation, imageUrl: image.url })

    // Chamar a API de rotação
    const response = await fetch(`${getBaseUrl()}/api/rotate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: image.url,
        rotation: rotation,
      }),
    })

    console.log("Resposta da API de rotação:", { status: response.status, ok: response.ok })

    // Verificar se a resposta é JSON
    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")

    let result: any
    if (isJson) {
      result = await response.json()
    } else {
      const textResponse = await response.text()
      console.error("Resposta não é JSON:", textResponse)
      return { error: `Erro no servidor: ${textResponse}` }
    }

    console.log("Resultado da API:", result)

    if (!response.ok) {
      return { error: result.error || `Erro HTTP ${response.status}` }
    }

    if (!result.success || !result.newUrl) {
      return { error: "Resposta inválida da API de rotação" }
    }

    // Atualizar a URL da imagem no banco de dados
    console.log("Atualizando URL no banco:", { oldUrl: image.url, newUrl: result.newUrl })

    await db.update(images).set({ url: result.newUrl }).where(eq(images.id, imageId))

    console.log("URL atualizada com sucesso no banco")

    revalidatePath(`/project/${image.projectId}`)

    return { success: true, newUrl: result.newUrl, message: "Imagem rotacionada com sucesso!" }
  } catch (error) {
    console.error("Erro ao rotacionar e salvar imagem:", error)
    return { error: `Erro interno: ${error instanceof Error ? error.message : String(error)}` }
  }
}
