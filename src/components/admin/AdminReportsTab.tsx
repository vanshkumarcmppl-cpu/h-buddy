import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  MessageSquare,
  User,
  Calendar,
  ExternalLink,
  Download
} from "lucide-react";

export const AdminReportsTab = () => {
  const { allReports, updateReport, loading } = useAdmin();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

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
        return 'default' as const;
      case 'under_review':
      case 'investigating':
        return 'outline' as const;
      case 'resolved':
      case 'verified':
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
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;
    
    setUpdating(true);
    try {
      const updates: any = {};
      if (statusUpdate) updates.status = statusUpdate;
      if (adminNotes.trim()) updates.admin_notes = adminNotes.trim();

      const { error } = await updateReport(selectedReport.id, selectedReport.type, updates);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Report updated successfully"
      });
      
      setSelectedReport(null);
      setAdminNotes("");
      setStatusUpdate("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const openReportDialog = (report: any) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
    setStatusUpdate(report.status);
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      // Get file from Supabase storage
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

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
            All Reports Management
          </CardTitle>
          <CardDescription>
            Manage and respond to user reports ({allReports.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
              <p className="text-muted-foreground">
                No reports have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allReports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <h4 className="font-semibold text-lg">{report.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {report.user_profile?.full_name || 'Unknown User'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(report.created_at)}
                        </span>
                        <span className="capitalize">{report.type} Report</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(report.status)} className="flex items-center gap-1">
                        {getStatusIcon(report.status)}
                        {report.status.replace(/_/g, ' ')}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openReportDialog(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Report Details & Management
                            </DialogTitle>
                            <DialogDescription>
                              Review and update report status and admin notes
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedReport && (
                            <div className="space-y-6">
                              {/* Report Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Report Information</h3>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Title:</strong> {selectedReport.title}</div>
                                    <div><strong>Type:</strong> {selectedReport.type}</div>
                                    <div><strong>Category:</strong> {selectedReport.category}</div>
                                    {selectedReport.severity && (
                                      <div className="flex items-center gap-2">
                                        <strong>Severity:</strong>
                                        <Badge variant={getSeverityVariant(selectedReport.severity)}>
                                          {selectedReport.severity}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="font-semibold mb-2">User Information</h3>
                                  <div className="space-y-2 text-sm">
                                    <div><strong>Name:</strong> {selectedReport.user_profile?.full_name || 'Unknown'}</div>
                                    <div><strong>Organization:</strong> {selectedReport.user_profile?.organization || 'Not specified'}</div>
                                    <div><strong>Submitted:</strong> {formatDate(selectedReport.created_at)}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <h3 className="font-semibold mb-2">Description</h3>
                                <div className="bg-muted p-3 rounded-md text-sm">
                                  {selectedReport.description}
                                </div>
                              </div>

                              {/* Evidence Files */}
                              {selectedReport.file_urls && selectedReport.file_urls.length > 0 && (
                                <div>
                                  <h3 className="font-semibold mb-2">Evidence Files</h3>
                                  <div className="space-y-2">
                                    {selectedReport.file_urls.map((fileUrl: string, index: number) => (
                                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">Evidence {index + 1}</span>
                                        <div className="flex gap-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                          >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => downloadFile(fileUrl, `evidence-${index + 1}`)}
                                          >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Admin Management */}
                              <div className="border-t pt-4">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Admin Management
                                </h3>
                                
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Update Status</label>
                                    <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="under_review">Under Review</SelectItem>
                                        <SelectItem value="investigating">Investigating</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="verified">Verified</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="false_positive">False Positive</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-2">Admin Notes/Response</label>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes or response for the user..."
                                      className="min-h-[100px]"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setSelectedReport(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateReport}
                                      disabled={updating}
                                    >
                                      {updating ? "Updating..." : "Update Report"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
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
                            {report.severity}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <span>User: <strong>{report.user_profile?.full_name || 'Unknown'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};