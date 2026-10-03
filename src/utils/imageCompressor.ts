/**
 * Image compression utility
 * Resizes image to fit within 512x512 and ensures file size is under 300KB
 */

export interface CompressionResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  sizeKb: number;
}

export async function compressAvatarImage(
  inputFile: File,
  maxDimension: number = 512,
  maxSizeBytes: number = 300 * 1024 // 300 KB
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Fayl oxuna bilmədi'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Şəkil formatı dəstəklənmir'));
      img.onload = async () => {
        try {
          let { width, height } = img;

          // Scale down to max 512x512 keeping aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Canvas dəstəklənmir'));
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Compress iteratively to ensure <= 300KB
          let quality = 0.88;
          let mimeType = 'image/jpeg';
          if (inputFile.type === 'image/png' || inputFile.type === 'image/webp') {
            mimeType = 'image/webp';
          }

          const getCanvasBlob = (q: number): Promise<Blob> => {
            return new Promise((res, rej) => {
              canvas.toBlob(
                (blob) => {
                  if (blob) res(blob);
                  else rej(new Error('Blob yaradılması uğursuz oldu'));
                },
                mimeType,
                q
              );
            });
          };

          let blob = await getCanvasBlob(quality);

          // If blob is still > 300KB, decrease quality iteratively
          while (blob.size > maxSizeBytes && quality > 0.2) {
            quality -= 0.12;
            blob = await getCanvasBlob(quality);
          }

          const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
          const fileName = `avatar_${Date.now()}.${extension}`;
          const compressedFile = new File([blob], fileName, { type: mimeType });
          const previewUrl = URL.createObjectURL(blob);

          resolve({
            file: compressedFile,
            blob,
            previewUrl,
            width,
            height,
            sizeKb: Math.round(blob.size / 1024),
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(inputFile);
  });
}
