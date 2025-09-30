import { useNavigate } from 'react-router-dom';
import { Wrench, CheckCircle, Clock, Users, AlertTriangle, Plus, ShoppingCart, ClipboardList, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppData } from '@/contexts/AppDataContext';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getStatusBadgeClasses } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tools, assignments } = useAppData();

  const totalTools = tools.length;
  const availableTools = tools.filter(t => t.status === 'Available').length;
  const inUseTools = tools.filter(t => t.status === 'In Use').length;
  const activeAssignments = assignments.filter(a => a.status === 'active').length;

  // Calculate calibration alerts
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const calibrationAlerts = tools.filter(tool => {
    if (!tool.isCalibrable || !tool.calibrationDue) return false;
    const dueDate = new Date(tool.calibrationDue);
    return dueDate <= thirtyDaysFromNow;
  });

  // Category breakdown
  const categoryBreakdown = tools.reduce((acc, tool) => {
    acc[tool.category] = (acc[tool.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Status breakdown for Pie Chart
  const statusBreakdown = tools.reduce((acc, tool) => {
    acc[tool.status] = (acc[tool.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusBreakdown).map(([name, value]) => ({ name, value }));

  const STATUS_COLORS: { [key: string]: string } = {
    'Available': 'hsl(var(--chart-1))',
    'In Use': 'hsl(var(--chart-2))',
    'Damaged': 'hsl(var(--chart-3))',
    'Lost': 'hsl(var(--chart-4))',
    'Cal. Due': 'hsl(var(--chart-5))',
  };

  const quickActions = [
    { title: 'Add New Tool', icon: Plus, path: '/tools' },
    { title: 'Checkout Tools', icon: ShoppingCart, path: '/checkout' },
    { title: 'View Assignments', icon: ClipboardList, path: '/assignments' },
    { title: 'View Reports', icon: FileText, path: '/reports' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your tool room inventory system</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Wrench className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTools}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableTools}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseTools}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Calibration Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Calibration Alerts</CardTitle>
            </div>
            <CardDescription>Tools requiring calibration within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {calibrationAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming calibrations</p>
            ) : (
              <div className="space-y-3">
                {calibrationAlerts.map(tool => {
                  const dueDate = new Date(tool.calibrationDue!);
                  const isOverdue = dueDate < today;
                  return (
                    <div key={tool.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.category}</p>
                      </div>
                      <Badge className={getStatusBadgeClasses(isOverdue ? 'Damaged' : 'Cal. Due')}>
                        {isOverdue ? 'Overdue' : `Due ${dueDate.toLocaleDateString()}`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => (
                <Button
                  key={action.path}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-sm text-center">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Category Breakdown */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Tools by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryBreakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(categoryBreakdown).map(([category, count]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <span className="text-muted-foreground">{count} tools</span>
                    </div>
                    <Progress value={(count / totalTools) * 100} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No tools in inventory</p>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tool Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    labelLine={false}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{
                      paddingTop: 20,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No status data available</p>
            )}
            <div className="space-y-2 pt-4">
              {statusChartData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.name] }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="font-medium text-sm">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
