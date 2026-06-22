import { Wrench, CheckCircle, Clock, Users, AlertTriangle, Plus, ShoppingCart, ClipboardList, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useAppData } from '@/contexts/AppDataContext';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { tools, assignments } = useAppData();
  const { t } = useTranslation();

  const totalTools = tools.length;
  const availableTools = tools.filter(t => t.status === 'Available').length;
  const inUseTools = tools.filter(t => t.status === 'In Use').length;
  const activeAssignments = assignments.filter(a => a.status === 'active').length;

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const calibrationAlerts = tools.filter(tool => {
    if (!tool.isCalibrable || !tool.calibrationDue) return false;
    const dueDate = new Date(tool.calibrationDue);
    return dueDate <= thirtyDaysFromNow;
  });

  const categoryBreakdown = tools.reduce((acc, tool) => {
    acc[tool.category] = (acc[tool.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusBreakdown = tools.reduce((acc, tool) => {
    acc[tool.status] = (acc[tool.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const quickActions = [
    { titleKey: 'dashboard.addNewTool', icon: Plus, page: 'tools', color: 'bg-primary' },
    { titleKey: 'dashboard.checkoutTools', icon: ShoppingCart, page: 'checkout', color: 'bg-info' },
    { titleKey: 'dashboard.viewAssignments', icon: ClipboardList, page: 'assignments', color: 'bg-purple-500' },
    { titleKey: 'dashboard.viewReports', icon: FileText, page: 'reports', color: 'bg-success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalTools')}</CardTitle>
            <Wrench className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTools}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.availableTools')}</CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableTools}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.inUse')}</CardTitle>
            <Clock className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseTools}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeAssignments')}</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Calibration Alerts */}
        <Card>
          <TooltipProvider delayDuration={0}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle>{t('dashboard.calibrationAlerts')}</CardTitle>
              </div>
              <CardDescription>{t('dashboard.calibrationAlertsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {calibrationAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingCalibrations')}</p>
              ) : (
                <div className="space-y-3">
                  {calibrationAlerts.map(tool => {
                    const dueDate = new Date(tool.calibrationDue!);
                    const isOverdue = dueDate < today;
                    const details = Object.entries(tool.customAttributes || {}).map(([key, value]) => `${key}: ${value}`);
                    return (
                      <div key={tool.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">{tool.category}</p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="focus-visible:ring-ring focus-visible:outline-none"
                              onClick={() => {
                                window.localStorage.setItem('toolSearchTerm', tool.name);
                                window.localStorage.setItem('toolStatusFilter', 'Cal. Due');
                                onNavigate('tools');
                              }}
                            >
                              <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                                {isOverdue ? t('dashboard.overdue') : dueDate.toLocaleDateString()}
                              </Badge>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-left">
                            <p className="font-semibold">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('dashboard.due')}: {dueDate.toLocaleDateString()}
                            </p>
                            {details.length > 0 && (
                              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                {details.map((detail, index) => (
                                  <p key={index}>{detail}</p>
                                ))}
                              </div>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                              {t('dashboard.clickBadgeHint')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </TooltipProvider>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>{t('dashboard.quickActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => (
                <Button
                  key={action.page}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform"
                  onClick={() => onNavigate(action.page)}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-sm text-center">{t(action.titleKey)}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.toolsByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown).map(([category, count]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">
                      {count} {t('dashboard.tools')}
                    </span>
                  </div>
                  <Progress value={(count / totalTools) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.toolStatusSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                let badgeVariant: 'default' | 'secondary' | 'destructive' = 'default';
                if (status === 'Available') badgeVariant = 'secondary';
                else if (status === 'Damaged' || status === 'Lost') badgeVariant = 'destructive';

                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{status}</span>
                    <Badge variant={badgeVariant}>{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
