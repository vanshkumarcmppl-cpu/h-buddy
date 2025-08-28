import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquareQuote, ShieldAlert } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";

export const MyReportsTab = () => {
  const { reports, loading } = useReports();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reported':
        return <Clock className="h-4 w-4" />;
      case 'under_review':
      case 'investigating':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
      case 'verified':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'false_positive':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reported':
        return 'secondary' as const;
      case 'under_review':
      case 'investigating':
        return 'default' as const; // Yellow/Orange in many themes
      case 'resolved':
      case 'verified':
      case 'closed':
        return 'secondary' as const;
      case 'rejected':
      case 'false_positive':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };
  
  const getSeverityVariant = (severity: string | null) => {
      if (!severity) return 'secondary';
      switch (severity.toLowerCase()) {
          case 'critical': return 'destructive';
          case 'high': return 'destructive';
          case 'medium': return 'default';
          case 'low': return 'secondary';
          default: return 'secondary';
      }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Reports
          </CardTitle>
          <CardDescription>
            Track the status of your submitted reports ({reports.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground">
                You haven't submitted any reports. Use the other tabs to report grievances or suspicious activities.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <h4 className="font-semibold text-lg">{report.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {report.type} Report
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(report.status)} className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap py-1 px-2">
                      {getStatusIcon(report.status)}
                      {report.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {report.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-y-2 gap-x-4 border-t pt-3">
                    <div className="flex items-center gap-4">
                      {report.category && (
                        <span className="capitalize">Category: <strong>{report.category.replace(/_/g, ' ')}</strong></span>
                      )}
                      {report.severity && (
                        <div className="flex items-center gap-2">
                            <span>Severity:</span>
                            <Badge variant={getSeverityVariant(report.severity)} className="capitalize">
                                <ShieldAlert className="h-3 w-3 mr-1.5" />
                                {report.severity}
                            </Badge>
                        </div>
                      )}
                    </div>
                    <span>Submitted: <strong>{formatDate(report.created_at)}</strong></span>
                  </div>
                  
                  {/* ENHANCED: Moderator Response Section */}
                  {report.admin_notes && (
                    <div className="mt-4">
                        <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-3 rounded-r-md">
                            <h5 className="text-sm font-semibold flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-200">
                                <MessageSquareQuote className="h-4 w-4" />
                                Moderator Response
                            </h5>
                            <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{report.admin_notes}</p>
                        </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
