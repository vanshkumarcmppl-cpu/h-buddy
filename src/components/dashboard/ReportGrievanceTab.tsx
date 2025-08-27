import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Upload, Send, X, FileText, Clock, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReports } from "@/hooks/useReports";

const ReportGrievanceTab = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    severity: ""
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { createReport, uploadFile } = useReports();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the report first
      const { data: report, error: reportError } = await createReport({
        type: 'grievance',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        file_urls: null
      });

      if (reportError || !report) {
        throw new Error('Failed to create report');
      }

      // Upload files if any
      const uploadPromises = files.map(file => uploadFile(file, report.id));
      const uploadResults = await Promise.all(uploadPromises);
      
      const fileUrls = uploadResults
        .filter(result => result.data)
        .map(result => result.data as string);

      toast({
        title: "Report Submitted",
        description: "Your grievance report has been submitted successfully and is under review."
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        severity: ""
      });
      setFiles([]);

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock existing reports
  const existingReports = [
    {
      id: "GR-001",
      title: "Unauthorized Access Attempt",
      category: "Access Control",
      priority: "High",
      status: "Under Review",
      date: "2024-01-20",
      progress: 60
    },
    {
      id: "GR-002",
      title: "Policy Violation Report",
      category: "Policy",
      priority: "Medium",
      status: "Resolved",
      date: "2024-01-15",
      progress: 100
    },
    {
      id: "GR-003",
      title: "System Vulnerability",
      category: "Technical",
      priority: "Critical",
      status: "In Progress",
      date: "2024-01-22",
      progress: 30
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "text-green-600 border-green-600";
      case "Under Review": return "text-blue-600 border-blue-600";
      case "In Progress": return "text-orange-600 border-orange-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "text-red-600 border-red-600";
      case "High": return "text-orange-600 border-orange-600";
      case "Medium": return "text-yellow-600 border-yellow-600";
      case "Low": return "text-green-600 border-green-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit New Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submit New Grievance
            </CardTitle>
            <CardDescription>
              Report cybersecurity policy violations, access issues, or other concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="access-control">Access Control</SelectItem>
                      <SelectItem value="policy">Policy Violation</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="discrimination">Discrimination</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({...formData, severity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the grievance..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="files">Supporting Documents</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    id="files"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="files"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload files or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOC, TXT, JPG, PNG (Max 10MB each)
                    </span>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Grievance Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Report Status Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Report Guidelines</CardTitle>
            <CardDescription>
              Important information about submitting grievance reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Be Specific</h4>
                  <p className="text-sm text-muted-foreground">
                    Provide detailed information including dates, times, and people involved
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Attach Evidence</h4>
                  <p className="text-sm text-muted-foreground">
                    Include screenshots, documents, or other supporting materials
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Response Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Most reports are reviewed within 24-48 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Follow Up</h4>
                  <p className="text-sm text-muted-foreground">
                    You'll receive updates on your report status via email
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Reports</CardTitle>
          <CardDescription>
            Track the status of your submitted grievance reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {existingReports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{report.title}</h4>
                    <Badge variant="outline" className={getPriorityColor(report.priority)}>
                      {report.priority}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Report ID:</span>
                    <p className="font-mono text-sm">{report.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <p className="text-sm">{report.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <p className="text-sm">{new Date(report.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progress:</span>
                    <span className="text-sm font-medium">{report.progress}%</span>
                  </div>
                  <Progress value={report.progress} className="h-2" />
                </div>

                <div className="flex justify-end mt-3">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { ReportGrievanceTab };