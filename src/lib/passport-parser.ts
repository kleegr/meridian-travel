// Passenger edit helper — add to getED map in ItineraryDetail
// Already handled via 'passenger' key in handleAdd/handleEditS
// The edit icon and passport upload are in the passengers tab JSX

// PASSPORT UPLOAD: Uses /api/ai to extract passport data from image
// Send base64 image → Claude extracts name, passport#, nationality, DOB, expiry

export async function parsePassportImage(file: File): Promise<Record<string, string>> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);\n    reader.onerror = () => reject(new Error('Failed to read file'));\n    reader.readAsDataURL(file);\n  });\n\n  try {\n    const response = await fetch('/api/ai', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        mode: 'passport',\n        fileBase64: base64,\n        mediaType: file.type || 'image/jpeg',\n      }),\n    });\n    const data = await response.json();\n    return data.passport || {};\n  } catch {\n    return {};\n  }\n}\n