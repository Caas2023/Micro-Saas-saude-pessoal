import { supabase } from '../lib/supabase';

export const storageService = {
  async uploadExamPhoto(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `exams/${fileName}`;

    const { error } = await supabase.storage
      .from('exam_photos')
      .upload(filePath, file);

    if (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('exam_photos')
      .getPublicUrl(filePath);

    return publicUrl;
  }
};
