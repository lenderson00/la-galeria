import type { NextRequest } from "next/server"
import sharp from "sharp"

const API_KEY = process.env.BUNNY_KEY!
const STORAGE_ZONE = "lavi"
const CDN_BASE_URL = "https://cdn.laviarquitetura.com.br"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const projectId = formData.get("projectId") as string

  if (!file) {
    return new Response("Arquivo não encontrado", { status: 400 })
  }

  const STORAGE_BASE_URL = `https://storage.bunnycdn.com/${STORAGE_ZONE}/images/${projectId}`

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Usa sharp para redimensionar e converter/comprimir a imagem
    const compressedImage = await sharp(buffer)
       .rotate() // <- aqui corrige a orientação baseada nos metadados EXIF
      .resize({ width: 1080, withoutEnlargement: true })
      .toFormat("webp", { quality: 75 })
      .toBuffer()

    const fileName = `${crypto.randomUUID()}.webp`
    const uploadUrl = `${STORAGE_BASE_URL}/${fileName}`

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: compressedImage,
    })

    if (!uploadResponse.ok) {
      console.error(await uploadResponse.text())
      return new Response("Erro ao fazer upload no BunnyCDN", { status: 500 })
    }

    return new Response(
      JSON.stringify({
        message: "Upload com sucesso!",
        url: `${CDN_BASE_URL}/images/${projectId}/${fileName}`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error: unknown) {
    console.error("Erro ao processar imagem:", error)
    return new Response("Erro interno no processamento", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const formData = await req.formData()
    const projectId = formData.get("projectId") as string
    const fileName = formData.get("fileName") as string

    if (!API_KEY) {
      console.error("BUNNY_KEY não encontrada")
      return new Response(JSON.stringify({ error: "Configuração do CDN não encontrada" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!projectId || !fileName) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios ausentes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const url = `https://storage.bunnycdn.com/${STORAGE_ZONE}/images/${projectId}/${fileName}`

    const options = {
      method: "DELETE",
      headers: {
        AccessKey: API_KEY,
      },
    }

    const result = await fetch(url, options)

    // 200 = sucesso, 404 = arquivo não existe (também consideramos sucesso)
    if (result.status !== 200 && result.status !== 404) {
      const errorText = await result.text()
      console.error("Erro do Bunny CDN:", result.status, errorText)

      return new Response(
        JSON.stringify({
          error: "Erro ao deletar arquivo do CDN",
          status: result.status,
          details: errorText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Erro na API de deleção:", error)
    return new Response(
      JSON.stringify({
        error: "Erro interno na deleção",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
