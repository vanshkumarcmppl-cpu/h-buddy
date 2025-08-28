import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Shield,
  Activity
} from "lucide-react";

interface AdminStatsTabProps {
  reports: any[];
  users: any[];
}

export const AdminStatsTab = ({ reports, users }: AdminStatsTabProps) => {
  // Calculate statistics
  const totalReports = reports.length;
  const totalUsers = users.length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const underReviewReports = reports.filter(r => r.status === 'under_review').length;
  
  // Status distribution
  const statusDistribution = [
    { name: 'Pending', value: pendingReports, color: '#fbbf24' },
    { name: 'Under Review', value: underReviewReports, color: '#f87171' },
    { name: 'Resolved', value: resolvedReports, color: '#34d399' },
    { name: 'Other', value: totalReports - pendingReports - underReviewReports - resolvedReports, color: '#94a3b8' }
  ].filter(item => item.value > 0);

  // Report types distribution
  const typeDistribution = [
    { 
      name: 'Grievance', 
      value: reports.filter(r => r.type === 'grievance').length,
      color: '#3b82f6'
    },
    { 
      name: 'Suspicious', 
      value: reports.filter(r => r.type === 'suspicious').length,
      color: '#ef4444'
    }
  ].filter(item => item.value > 0);

  // Severity distribution
  const severityDistribution = [
    { name: 'Critical', value: reports.filter(r => r.severity === 'critical').length, color: '#dc2626' },
    { name: 'High', value: reports.filter(r => r.severity === 'high').length, color: '#ea580c' },
    { name: 'Medium', value: reports.filter(r => r.severity === 'medium').length, color: '#ca8a04' },
    { name: 'Low', value: reports.filter(r => r.severity === 'low').length, color: '#16a34a' }
  ].filter(item => item.value > 0);

  // Monthly trends (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const monthStr = `${monthName} ${year}`;
    
    const monthReports = reports.filter(r => {
      const reportDate = new Date(r.created_at);
      return reportDate.getMonth() === date.getMonth() && reportDate.getFullYear() === date.getFullYear();
    }).length;

    const monthUsers = users.filter(u => {
      const userDate = new Date(u.created_at);
      return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear();
    }).length;

    monthlyData.push({
      month: monthStr,
      reports: monthReports,
      users: monthUsers
    });
  }

  const stats = [
    {
      title: "Total Reports",
      value: totalReports,
      description: "All time submissions",
      icon: FileText,
      trend: `${((resolvedReports / totalReports) * 100).toFixed(1)}% resolved`,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: totalUsers,
      description: "Registered users",
      icon: Users,
      trend: `${users.filter(u => u.reports_count > 0).length} active reporters`,
      color: "text-green-600"
    },
    {
      title: "Pending Review",
      value: pendingReports,
      description: "Requires attention",
      icon: Clock,
      trend: pendingReports > 0 ? "Action needed" : "All clear",
      color: "text-orange-600"
    },
    {
      title: "Resolution Rate",
      value: `${totalReports > 0 ? ((resolvedReports / totalReports) * 100).toFixed(1) : 0}%`,
      description: "Cases resolved",
      icon: CheckCircle,
      trend: resolvedReports > pendingReports ? "Above target" : "Below target",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className={`text-xs mt-1 ${stat.color}`}>
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Report Status Distribution
            </CardTitle>
            <CardDescription>Current status of all reports</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Report Type Distribution
            </CardTitle>
            <CardDescription>Breakdown by report category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Severity Distribution
            </CardTitle>
            <CardDescription>Reports by threat/priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Reports and user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} name="Reports" />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Summary</CardTitle>
          <CardDescription>Latest system activity and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.slice(0, 5).map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-sm font-medium">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.type} report by {report.user_profile?.full_name || 'Unknown User'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {report.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};