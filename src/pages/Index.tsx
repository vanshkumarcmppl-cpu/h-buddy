import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Users, 
  AlertTriangle, 
  FileText, 
  Bot,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Advanced Threat Detection",
      description: "AI-powered analysis of security threats and vulnerabilities"
    },
    {
      icon: Lock,
      title: "Secure Authentication",
      description: "Multi-factor authentication with OTP for enhanced security"
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Separate access controls for users and administrators"
    },
    {
      icon: FileText,
      title: "Comprehensive Reporting",
      description: "Submit and track grievances and suspicious activities"
    },
    {
      icon: Bot,
      title: "AI Security Assistant",
      description: "24/7 AI chatbot for cybersecurity guidance and support"
    },
    {
      icon: AlertTriangle,
      title: "Real-time Monitoring",
      description: "Continuous monitoring and instant threat notifications"
    }
  ];

  const stats = [
    { label: "Security Reports Processed", value: "10,000+" },
    { label: "Threats Neutralized", value: "5,240" },
    { label: "Active Users", value: "2,500+" },
    { label: "Uptime", value: "99.9%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="relative cyber-grid">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 rounded-full bg-primary/10 animate-pulse-glow">
                <Shield className="h-16 w-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-slide-up">
              CyberSecure Portal
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
              Advanced cybersecurity platform for threat detection, reporting, and analysis. 
              Protect your organization with AI-powered security solutions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/login">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/signup">
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced Security Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive cybersecurity tools designed to protect and empower your organization
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">CyberSecure Portal</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 CyberSecure Portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
