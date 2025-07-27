"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveImageUrl } from "@/lib/actions"
import { Upload, X } from "lucide-react"

interface ImageUploadProps {
  projectId: string
}

export function ImageUpload({ projectId }: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({})

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)

    for (const file of files) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: true }))

      const formData = new FormData()
      formData.append("file", file)
      formData.append("projectId", projectId)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (result.url) {
          await saveImageUrl(projectId, result.url)
        }

        setUploadProgress((prev) => ({ ...prev, [file.name]: false }))
      } catch (error) {
        console.error("Erro no upload:", error)
        setUploadProgress((prev) => ({ ...prev, [file.name]: false }))
      }
    }

    setFiles([])
    setUploading(false)
    setUploadProgress({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Upload de Imagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB)</p>
            </div>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Arquivos selecionados:</h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <span className="text-sm truncate">{file.name}</span>
                <div className="flex items-center space-x-2">
                  {uploadProgress[file.name] && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <Button size="sm" variant="ghost" onClick={() => removeFile(index)} disabled={uploading}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button onClick={uploadFiles} disabled={uploading} className="w-full">
              {uploading ? "Fazendo Upload..." : `Upload ${files.length} arquivo(s)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
