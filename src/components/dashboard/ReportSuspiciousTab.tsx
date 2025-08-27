import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Upload, Shield, Globe, Mail, Phone, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReports } from "@/hooks/useReports";

const ReportSuspiciousTab = () => {
  // State matches the 'suspicious_entities' table schema
  const [formData, setFormData] = useState({
    entity_type: "",
    entity_value: "",
    threat_level: "",
    description: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createSuspiciousReport, uploadFile, updateReportWithFileUrls } = useReports();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entity_type || !formData.entity_value || !formData.description) {
        toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);

    try {
      // Step 1: Create the report entry
      const { data: report, error: reportError } = await createSuspiciousReport(formData);

      if (reportError || !report) {
        throw new Error(reportError?.message || 'Failed to create report.');
      }

      // Step 2: Upload files if they exist
      if (files.length > 0) {
          const uploadPromises = files.map(file => uploadFile(file, 'suspicious', report.id));
          const uploadResults = await Promise.all(uploadPromises);
          const filePaths = uploadResults
            .filter(result => !result.error && result.path)
            .map(result => result.path as string);

          // Step 3: Update the report with file paths
          if (filePaths.length > 0) {
            await updateReportWithFileUrls(report.id, 'suspicious_entities', filePaths);
          }
      }

      toast({
        title: "Report Submitted Successfully",
        description: "Your suspicious activity report is under review. Track its status in 'My Reports'."
      });

      // Step 4: Reset form
      setFormData({ entity_type: "", entity_value: "", threat_level: "", description: "" });
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
      <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Immediate Threat?</strong> If this is an active security incident, please contact the emergency response team directly.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Suspicious Activity Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Report Suspicious Activity
            </CardTitle>
            <CardDescription>
              Report potential threats like malware, phishing, or suspicious websites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity_type">Entity Type</Label>
                  <Select
                    value={formData.entity_type}
                    onValueChange={(value) => setFormData({...formData, entity_type: value})}
                  >
                    <SelectTrigger><SelectValue placeholder="Select entity type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website URL</SelectItem>
                      <SelectItem value="phone_number">Phone Number</SelectItem>
                      <SelectItem value="social_media_id">Social Media ID</SelectItem>
                      <SelectItem value="upi_id">UPI ID</SelectItem>
                      <SelectItem value="mobile_app">Mobile App</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="threat_level">Threat Level</Label>
                    <Select
                        value={formData.threat_level}
                        onValueChange={(value) => setFormData({...formData, threat_level: value})}
                    >
                        <SelectTrigger><SelectValue placeholder="Select threat level" /></SelectTrigger>
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
                <Label htmlFor="entity_value">Identifier</Label>
                <Input
                  id="entity_value"
                  placeholder="e.g., http://suspicious-site.com or +1-555-123-4567"
                  value={formData.entity_value}
                  onChange={(e) => setFormData({...formData, entity_value: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe why this entity is suspicious. What happened? What did you observe?"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="files">Evidence Files</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    id="files"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png,.eml,.msg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="files" className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Upload screenshots, emails, or other evidence</span>
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
                  <><Send className="h-4 w-4 mr-2" /> Submit Suspicious Activity Report</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security Tips</CardTitle>
            <CardDescription>How to identify and handle suspicious activities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Phishing Emails</h4>
                  <p className="text-sm text-muted-foreground">Look for spelling errors, urgent language, and suspicious links or sender addresses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Suspicious Websites</h4>
                  <p className="text-sm text-muted-foreground">Check for HTTPS, verify domain names (e.g., go0gle.com), and be cautious of pop-ups.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Social Engineering</h4>
                  <p className="text-sm text-muted-foreground">Be wary of unsolicited calls requesting passwords, access codes, or personal information.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { ReportSuspiciousTab };
