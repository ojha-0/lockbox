import { File, FileText, Image, FileSpreadsheet } from 'lucide-react';

export default function FileTypeIcon({ mimeType, size = 18, className = 'text-gray-600' }) {
  if (!mimeType) return <File size={size} className={className} />;
  if (mimeType.startsWith('image/')) return <Image size={size} className={className} />;
  if (mimeType === 'application/pdf') return <FileText size={size} className={className} />;
  if (mimeType.includes('word')) return <FileText size={size} className={className} />;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet size={size} className={className} />;
  return <File size={size} className={className} />;
}
