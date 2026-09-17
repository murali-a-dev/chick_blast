export async function uploadToImgBB(fileBuffer) {
  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    throw new Error('Server upload service not configured: IMGBB_API_KEY is missing')
  }
  const base64Image = fileBuffer.toString('base64')
  const formData = new URLSearchParams()
  formData.append('key', apiKey)
  formData.append('image', base64Image)

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to upload image to ImgBB')
  }

  return data.data.url
}
