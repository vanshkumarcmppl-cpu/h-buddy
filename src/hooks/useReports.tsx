import { useEffect, useState, useCallback } from 'react'; // import useCallback
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';

// A unified interface for frontend use
export interface Report {
  id: string;
  user_id: string;
  type: 'grievance' | 'suspicious';
  title: string;
  description: string;
  category: string | null;
  severity: string | null;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected' | 'reported' | 'investigating' | 'verified' | 'false_positive';
  file_urls: string[] | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Add other potential fields
  entity_type?: string;
  entity_value?: string;
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReports = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch from both tables in parallel
      const [grievanceRes, suspiciousRes] = await Promise.all([
        supabase.from('grievance_reports').select('*').eq('user_id', user.id),
        supabase.from('suspicious_entities').select('*').eq('user_id', user.id)
      ]);

      if (grievanceRes.error || suspiciousRes.error) {
        throw grievanceRes.error || suspiciousRes.error;
      }
      
      // Map grievance reports to the unified Report interface
      const grievanceData = (grievanceRes.data || []).map(r => ({
        ...r,
        type: 'grievance' as const,
        category: r.complaint_category,
        severity: r.priority_level,
        file_urls: r.evidence_files,
      }));

      // Map suspicious reports to the unified Report interface
      const suspiciousData = (suspiciousRes.data || []).map(r => ({
        ...r,
        id: r.id,
        type: 'suspicious' as const,
        title: `Suspicious ${r.entity_type.replace('_', ' ')}: ${r.entity_value}`,
        category: r.entity_type,
        severity: r.threat_level,
        file_urls: r.evidence_files,
        admin_notes: null // This table doesn't have admin_notes, add if needed
      }));

      // Combine, sort by creation date, and set state
      const allReports = [...grievanceData, ...suspiciousData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setReports(allReports as Report[]);
    } catch (err: any) {
      setError('Failed to fetch reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReports();

    if (!user) return;

    // Set up two realtime subscriptions
    const grievanceChannel = supabase
      .channel('grievance-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grievance_reports', filter: `user_id=eq.${user.id}` },
        () => fetchReports() // Refetch all reports on any change
      )
      .subscribe();
      
    const suspiciousChannel = supabase
      .channel('suspicious-entities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suspicious_entities', filter: `user_id=eq.${user.id}` },
        () => fetchReports() // Refetch all reports on any change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(grievanceChannel);
      supabase.removeChannel(suspiciousChannel);
    };
  }, [user, fetchReports]);

  // Specific function to create a grievance report
  const createGrievanceReport = async (reportData: any) => {
    if (!user) return { data: null, error: { message: 'User not authenticated' } as PostgrestError };
    const { data, error } = await supabase
      .from('grievance_reports')
      .insert({ ...reportData, user_id: user.id })
      .select().single();
    return { data, error };
  };
  
  // Specific function to create a suspicious report
  const createSuspiciousReport = async (reportData: any) => {
    if (!user) return { data: null, error: { message: 'User not authenticated' } as PostgrestError };
    const { data, error } = await supabase
      .from('suspicious_entities')
      .insert({ ...reportData, user_id: user.id })
      .select().single();
    return { data, error };
  };

  const uploadFile = async (file: File, reportType: 'grievance' | 'suspicious', reportId: string) => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${reportType}/${reportId}/${Date.now()}.${fileExt}`;

    try {
      const { data, error } = await supabase.storage
        .from('evidence-files') // This bucket is from your SQL
        .upload(fileName, file);

      if (error) throw error;
      
      return { path: data.path, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  // Function to update a report with file URLs after upload
  const updateReportWithFileUrls = async (reportId: string, table: 'grievance_reports' | 'suspicious_entities', urls: string[]) => {
      const { data, error } = await supabase
        .from(table)
        .update({ evidence_files: urls })
        .eq('id', reportId);
      return { data, error };
  };


  return {
    reports,
    loading,
    error,
    createGrievanceReport,
    createSuspiciousReport,
    uploadFile,
    updateReportWithFileUrls,
  };
};