/**
 * Client-Side Image Compression Utility for CONNECT
 * Resizes and compresses high-resolution smartphone camera photos (4MB - 20MB)
 * down to lightweight ~40KB - 80KB base64 strings using off-screen HTML5 Canvas.
 *
 * Prevents:
 * 1. HTTP 413 Payload Too Large errors on Netlify Serverless Functions.
 * 2. DOMException QuotaExceededError in localStorage.
 * 3. Network lag on mobile uploads.
 */

/**
 * Compresses an image File and returns a lightweight Base64 Data URL.
 * @param {File|Blob} file - The image file from an <input type="file">
 * @param {Object} [options]
 * @param {number} [options.maxWidth=512] - Max width in pixels (avatars need ~120-256px)
 * @param {number} [options.maxHeight=512] - Max height in pixels
 * @param {number} [options.quality=0.82] - JPEG quality between 0.1 and 1.0
 * @returns {Promise<string>} Compressed Base64 Data URL
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.82,
  } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to decode image in memory'));
      };

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Preserve aspect ratio while constraining to maxWidth/maxHeight
          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const bestRatio = Math.min(widthRatio, heightRatio);

            width = Math.round(width * bestRatio);
            height = Math.round(height * bestRatio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            // Fallback to original reader result if canvas 2D is unsupported
            return resolve(readerEvent.target.result);
          }

          // Fill clean background to avoid transparent black artifact on JPEG conversion
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Export as optimized JPEG (standard for profile avatars)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression error, falling back to original:', canvasErr);
          resolve(readerEvent.target.result);
        }
      };

      img.src = readerEvent.target.result;
    };

    reader.readAsDataURL(file);
  });
};
