
export interface ConversionFormat {
  extension: string;
  category: 'Standard' | 'Web' | 'Professionnel' | 'Raw' | 'Vecteur' | 'Autre';
  description: string;
}

export interface ImageFile {
  file: File;
  preview: string;
  width: number;
  height: number;
  name: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  READY = 'READY',
  CONVERTING = 'CONVERTING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
