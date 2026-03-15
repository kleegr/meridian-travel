// Passport OCR via server-side API route — extracts passport info from photo

export interface PassportData {
  name?: string;
  passport?: string;
  passportExpiry?: string;
  nationality?: string;
  dob?: string;
  gender?: string;
}

export async function parsePassportImage(file: File): Promise<PassportData> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'passport',
        fileBase64: base64,
        mediaType: file.type || 'image/jpeg',
      }),
    });
    const data = await response.json();
    return data.passport || {};
  } catch {
    return {};
  }
}
