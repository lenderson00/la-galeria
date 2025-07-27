import type { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { images, projects } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Verify project exists
    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1)

    if (!project[0]) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get all images for the project in correct order
    const projectImages = await db
      .select()
      .from(images)
      .where(eq(images.projectId, id))
      .orderBy(asc(images.sortOrder), asc(images.createdAt))

    const response = {
      projectId: id,
      images: projectImages.map((img) => img.url),
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Erro na API:", error)
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
