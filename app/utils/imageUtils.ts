import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file for efficient uploading.
 * Targets ~1MB size and max dimensions of 1920px.
 * 
 * @param file The original image file
 * @returns A compressed File object
 */
export async function compressImage(file: File): Promise<File> {
  // If not an image, return as-is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // If already small (under 1MB), no need to compress
  if (file.size < 1 * 1024 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 1,           // Target size 1MB
    maxWidthOrHeight: 1920, // Max dimensions 1920px to maintain HD quality
    useWebWorker: true,     // Use web worker for performance
    initialQuality: 0.8,    // 80% quality start
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert blob back to file to maintain original name and type
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('Image compression failed, falling back to original file:', error);
    return file;
  }
}
