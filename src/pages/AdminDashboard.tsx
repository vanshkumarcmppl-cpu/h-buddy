import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Shield, 
  Users, 
  FileText, 
  AlertTriangle, 
  LogOut,
  Settings,
  Activity,
  Database,
  UserCheck,
  Crown
} from "lucide-react";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminStatsTab } from "@/components/admin/AdminStatsTab";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("stats");
  const { user, signOut } = useAuth();
  const { isAdmin, loading, allReports, allUsers } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Signed out successfully"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect to login
  }

  const stats = [
    {
      title: "Total Reports",
      value: allReports.length.toString(),
      description: "All submitted reports",
      icon: FileText,
      trend: `${allReports.filter(r => r.status === 'pending').length} pending`
    },
    {
      title: "Total Users",
      value: allUsers.length.toString(), 
      description: "Registered users",
      icon: Users,
      trend: "Active community"
    },
    {
      title: "Pending Review",
      value: allReports.filter(r => r.status === 'pending').length.toString(),
      description: "Awaiting admin action",
      icon: AlertTriangle,
      trend: "Needs attention"
    },
    {
      title: "System Status",
      value: "Online",
      description: "All systems operational",
      icon: Activity,
      trend: "Excellent"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary" />
                <Crown className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Administrative Control Panel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <UserCheck className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Welcome, Administrator!</h2>
              <p className="text-muted-foreground">
                Manage reports, users, and system operations
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border/50 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Manage Reports
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Users
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  System
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats">
                <AdminStatsTab reports={allReports} users={allUsers} />
              </TabsContent>

              <TabsContent value="reports">
                <AdminReportsTab />
              </TabsContent>

              <TabsContent value="users">
                <AdminUsersTab />
              </TabsContent>

              <TabsContent value="system">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      System Management
                    </CardTitle>
                    <CardDescription>
                      Advanced system operations and database management
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
                        <div className="font-semibold">Database Backup</div>
                        <div className="text-sm text-muted-foreground">Create system backup</div>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
                        <div className="font-semibold">System Logs</div>
                        <div className="text-sm text-muted-foreground">View system activity</div>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
                        <div className="font-semibold">Security Audit</div>
                        <div className="text-sm text-muted-foreground">Run security checks</div>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2">
                        <div className="font-semibold">Performance Monitor</div>
                        <div className="text-sm text-muted-foreground">Monitor system health</div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;