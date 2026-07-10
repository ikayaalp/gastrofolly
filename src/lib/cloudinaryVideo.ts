export const getCloudinaryHlsUrl = (url: string): string | null => {
  if (!url) return null;
  if (!url.includes('cloudinary.com/')) return url;
  
  let hlsUrl = url.replace(/\.(mp4|mov|webm)$/i, '.m3u8');
  if (hlsUrl.includes('/upload/') && !hlsUrl.includes('/upload/sp_auto/')) {
    hlsUrl = hlsUrl.replace('/upload/', '/upload/sp_auto/');
  }
  return hlsUrl;
};
