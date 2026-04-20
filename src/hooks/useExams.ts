import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SavedResult } from '../types/exam';

export const useExams = (userId: string) => {
  const queryClient = useQueryClient();

  const getExams = useQuery({
    queryKey: ['exams', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          exam_results (*)
        `)
        .eq('user_id', userId)
        .order('exam_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const saveExamMutation = useMutation({
    mutationFn: async ({ examData, results }: { examData: any, results: SavedResult[] }) => {
      // 1. Inserir Exame
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert([examData])
        .select()
        .single();

      if (examError) throw examError;

      // 2. Inserir Resultados
      const resultsWithId = results.map(r => ({ ...r, exam_id: exam.id }));
      const { error: resultsError } = await supabase
        .from('exam_results')
        .insert(resultsWithId);

      if (resultsError) throw resultsError;

      return exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', userId] });
    },
  });

  return { getExams, saveExamMutation };
};
