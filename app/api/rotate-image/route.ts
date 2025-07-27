import type { NextRequest } from "next/server"
import { NextResponse as NextRes } from "next/server"
import sharp from "sharp"

const API_KEY = process.env.BUNNY_KEY!
const STORAGE_ZONE = "lavi"
const CDN_BASE_URL = "https://cdn.laviarquitetura.com.br"

function errorResponse(message: string, status: number, details?: any) {
  console.error(`[API Error] ${message}`, details)
  return NextRes.json({ error: message, details: details || null }, { status })
}

export async function POST(req: NextRequest) {
  try {
    let body: { imageUrl?: string; rotation?: number }
    try {
      body = await req.json()
    } catch (e) {
      return errorResponse("Corpo da requisição inválido (não é JSON)", 400, e)
    }

    const { imageUrl, rotation } = body

    if (!imageUrl || typeof rotation !== "number") {
      return errorResponse("Parâmetros 'imageUrl' e 'rotation' são obrigatórios", 400)
    }

    // 1. Baixar a imagem original
    let imageResponse: Response
    try {
      imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        return errorResponse(
          "Falha ao baixar a imagem original do CDN",
          imageResponse.status,
          await imageResponse.text(),
        )
      }
    } catch (e) {
      return errorResponse("Erro de rede ao tentar baixar a imagem", 500, e)
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // 2. Rotacionar e processar com Sharp
    let processedBuffer: Buffer
    try {
      processedBuffer = await sharp(imageBuffer).rotate(rotation).toFormat("webp", { quality: 75 }).toBuffer()
    } catch (e) {
      return errorResponse("Erro ao processar a imagem com Sharp", 500, e)
    }

    // 3. Extrair informações para o novo upload
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split("/").filter(Boolean)
    const originalFileName = pathParts.at(-1)
    const projectId = pathParts.at(-2)

    if (!originalFileName || !projectId) {
      return errorResponse("Não foi possível extrair o nome do arquivo ou ID do projeto da URL", 400, imageUrl)
    }

    const timestamp = Date.now()
    const baseName = originalFileName.replace(/\.[^.]+$/, "")
    const newFileName = `${baseName}_${timestamp}.webp`
    const uploadUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE}/images/${projectId}/${newFileName}`

    // 4. Fazer upload da nova imagem
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { AccessKey: API_KEY, "Content-Type": "application/octet-stream" },
      body: processedBuffer,
    })

    if (!uploadResponse.ok) {
      return errorResponse(
        "Erro ao fazer upload da imagem rotacionada para o CDN",
        uploadResponse.status,
        await uploadResponse.text(),
      )
    }

    // 5. Deletar a imagem antiga (opcional, não bloqueia o sucesso)
    const deleteUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE}/images/${projectId}/${originalFileName}`
    fetch(deleteUrl, { method: "DELETE", headers: { AccessKey: API_KEY } }).catch((err) => {
      console.warn(`[API Warning] Falha ao deletar imagem antiga: ${deleteUrl}`, err)
    })

    // 6. Retornar sucesso
    const newImageUrl = `${CDN_BASE_URL}/images/${projectId}/${newFileName}`
    return NextRes.json({
      success: true,
      newUrl: newImageUrl,
      message: "Imagem rotacionada e salva com sucesso",
    })
  } catch (error) {
    // Catch-all para qualquer erro inesperado
    return errorResponse("Erro interno inesperado no servidor", 500, error)
  }
}
