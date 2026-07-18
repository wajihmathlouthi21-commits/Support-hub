export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface Guide {
  id: number;
  category_id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: string;
  is_private?: number;
  image_url?: string;
  video_urls?: string;
}

export interface Step {
  id?: number;
  guide_id: number;
  step_number: number;
  title: string;
  description: string;
  image_url: string;
  video_url?: string;
}

export interface GuideWithSteps {
  guide: Guide;
  steps: Step[];
}

export interface User {
  id?: number;
  username: string;
  password?: string;
  role?: string;
}

