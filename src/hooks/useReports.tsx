import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Report {
  id: string;
  user_id: string;
  type: 'grievance' | 'suspicious';
  title: string;
  description: string;
  category: string | null;
  severity: string | null;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  file_urls: string[] | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setReports((data || []) as Report[]);
        }
      } catch (err) {
        setError('Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    // Set up realtime subscription
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports(prev => [payload.new as Report, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReports(prev => prev.map(report => 
              report.id === payload.new.id ? payload.new as Report : report
            ));
          } else if (payload.eventType === 'DELETE') {
            setReports(prev => prev.filter(report => report.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createReport = async (reportData: Omit<Report, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at' | 'admin_notes'>) => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          ...reportData,
          user_id: user.id,
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const uploadFile = async (file: File, reportId: string) => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${reportId}/${Date.now()}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('report-files')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('report-files')
        .getPublicUrl(fileName);

      return { data: publicUrl, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  return {
    reports,
    loading,
    error,
    createReport,
    uploadFile
  };
};