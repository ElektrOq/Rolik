export interface VideoScene {
  id: number;
  startTime: number;
  endTime: number;
  duration: number;
  voiceover: string;
  voiceoverEn?: string;
  imagePrompt: string;
  visualDescription: string;
  editingCue: string;
  videoPrompt?: string;
}

export interface VideoSection {
  id: number;
  title: string;
  description: string;
  estimatedDuration: number;
  estimatedCharacters?: number;
}

export interface VideoScript {
  title: string;
  description: string;
  targetDuration: number;
  sections: VideoSection[];
}
