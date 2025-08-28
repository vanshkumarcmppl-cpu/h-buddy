import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Report } from '@/hooks/useReports';
import { UserProfile } from '@/hooks/useProfile';

export interface AdminReport extends Report {
  user_profile?: UserProfile;
}

export interface UserData {
  id: string;
  email: string;
  created_at: string;
  profile?: UserProfile;
  reports_count: number;
  last_sign_in_at?: string;
}

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allReports, setAllReports] = useState<AdminReport[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const { user } = useAuth();

  // Check if current user is admin
  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!data && !error);
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all reports with user profiles
  const fetchAllReports = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const [grievanceRes, suspiciousRes] = await Promise.all([
        supabase
          .from('grievance_reports')
          .select(`
            *,
            profiles!inner(*)
          `),
        supabase
          .from('suspicious_entities')
          .select(`
            *,
            profiles!inner(*)
          `)
      ]);

      if (grievanceRes.error || suspiciousRes.error) {
        throw grievanceRes.error || suspiciousRes.error;
      }

      // Map grievance reports
      const grievanceData = (grievanceRes.data || []).map(r => ({
        ...r,
        type: 'grievance' as const,
        category: r.complaint_category,
        severity: r.priority_level,
        file_urls: r.evidence_files,
        user_profile: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
      }));

      // Map suspicious reports
      const suspiciousData = (suspiciousRes.data || []).map(r => ({
        ...r,
        type: 'suspicious' as const,
        title: `Suspicious ${r.entity_type.replace('_', ' ')}: ${r.entity_value}`,
        category: r.entity_type,
        severity: r.threat_level,
        file_urls: r.evidence_files,
        user_profile: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
      }));

      // Combine and sort by creation date
      const reports = [...grievanceData, ...suspiciousData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAllReports(reports as AdminReport[]);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  }, [isAdmin]);

  // Update report status and admin notes
  const updateReport = async (
    reportId: string, 
    type: 'grievance' | 'suspicious',
    updates: { status?: string; admin_notes?: string }
  ) => {
    const table = type === 'grievance' ? 'grievance_reports' : 'suspicious_entities';
    
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (!error) {
      await fetchAllReports(); // Refresh data
    }

    return { data, error };
  };

  // Fetch all users
  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      // Get all profiles with report counts
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          grievance_reports(count),
          suspicious_entities(count)
        `);

      if (profileError) throw profileError;

      // Transform data
      const users = profiles?.map(profile => ({
        id: profile.user_id,
        email: profile.full_name || 'Unknown',
        created_at: profile.created_at,
        profile,
        reports_count: 0 // We'll calculate this separately since aggregate functions don't work as expected
      })) || [];

      setAllUsers(users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [isAdmin]);

  // Make user admin
  const makeUserAdmin = async (userEmail: string) => {
    const { data, error } = await supabase.rpc('make_user_admin', {
      _user_email: userEmail
    });
    return { data, error };
  };

  // Delete user profile
  const deleteUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (!error) {
      await fetchAllUsers(); // Refresh data
    }
    
    return { data, error };
  };

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllReports();
      fetchAllUsers();
    }
  }, [isAdmin, fetchAllReports, fetchAllUsers]);

  return {
    isAdmin,
    loading,
    allReports,
    allUsers,
    updateReport,
    makeUserAdmin,
    deleteUserProfile,
    refreshData: () => {
      fetchAllReports();
      fetchAllUsers();
    }
  };
};