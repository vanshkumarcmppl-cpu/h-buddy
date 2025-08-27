import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Send, Clock, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReports } from "@/hooks/useReports";

const ReportGrievanceTab = () => {
  // State matches the 'grievance_reports' table schema
  const [formData, setFormData] = useState({
    title: "",
    complaint_category: "",
    priority_level: "",
    description: "",
    location: "Online", // Default value as it's required in DB
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createGrievanceReport, uploadFile, updateReportWithFileUrls } = useReports();

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
    if (!formData.title || !formData.complaint_category || !formData.description || !formData.location) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);

    try {
      // Step 1: Create the report entry in the database
      const { data: report, error: reportError } = await createGrievanceReport(formData);

      if (reportError || !report) {
        throw new Error(reportError?.message || 'Failed to create report. Please try again.');
      }

      // Step 2: If there are files, upload them to storage
      if (files.length > 0) {
        const uploadPromises = files.map(file => uploadFile(file, 'grievance', report.id));
        const uploadResults = await Promise.all(uploadPromises);
        
        const filePaths = uploadResults
          .filter(result => !result.error && result.path)
          .map(result => result.path as string);

        // Step 3: Update the report with the paths of the uploaded files
        if (filePaths.length > 0) {
          await updateReportWithFileUrls(report.id, 'grievance_reports', filePaths);
        }
      }

      toast({
        title: "Report Submitted Successfully",
        description: "Your grievance report is now pending review. You can track its status in 'My Reports'."
      });

      // Step 4: Reset the form
      setFormData({ title: "", complaint_category: "", priority_level: "", description: "", location: "Online" });
      setFiles([]);

    } catch (error: any) {
      console.error('Submission Error:', error);
      toast({
        title: "Submission Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit New Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submit New Grievance
            </CardTitle>
            <CardDescription>
              Report cybersecurity policy violations, access issues, or other concerns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Unauthorized Access to Shared Drive"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complaint_category">Category</Label>
                  <Select
                    value={formData.complaint_category}
                    onValueChange={(value) => setFormData({...formData, complaint_category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="access-control">Access Control</SelectItem>
                      <SelectItem value="policy-violation">Policy Violation</SelectItem>
                      <SelectItem value="technical-issue">Technical Issue</SelectItem>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="discrimination">Discrimination</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority_level">Priority Level</Label>
                  <Select
                    value={formData.priority_level}
                    onValueChange={(value) => setFormData({...formData, priority_level: value})}
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
                  placeholder="Provide detailed information about the grievance, including dates, times, individuals involved, and specific actions taken..."
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
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Screenshots, documents, or other evidence
                    </span>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <h4 className="text-sm font-medium">Selected files:</h4>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Clock className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Submit Grievance Report</>
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
              Important information about submitting grievance reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Be Specific</h4>
                  <p className="text-sm text-muted-foreground">
                    Provide detailed information including dates, times, and people involved.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Attach Evidence</h4>
                  <p className="text-sm text-muted-foreground">
                    Include screenshots, documents, or other supporting materials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Response Time</h4>
                  <p className="text-sm text-muted-foreground">
                    Our team aims to review all new reports within 24-48 business hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Track Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    You can monitor the status of all your submissions in the "My Reports" tab.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { ReportGrievanceTab };
