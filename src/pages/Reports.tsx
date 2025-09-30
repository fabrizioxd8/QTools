import { useState, useMemo } from 'react';
import { FileText, Download, Printer, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

export default function Reports() {
  const { tools, assignments } = useAppData();
  const [dateRange, setDateRange] = useState('30');

  // Calculate date range
  const today = new Date();
  const startDate = new Date(today.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);

  // Filter assignments within date range
  const filteredAssignments = assignments.filter(a => {
    const checkoutDate = new Date(a.checkoutDate);
    return checkoutDate >= startDate && checkoutDate <= today;
  });

  // Calculate activity log
  const activityLog: Array<{
    date: string;
    action: 'Checkout' | 'Check-in';
    worker: string;
    project: string;
    tool: string;
  }> = [];

  filteredAssignments.forEach(assignment => {
    assignment.tools.forEach(tool => {
      activityLog.push({
        date: assignment.checkoutDate,
        action: 'Checkout',
        worker: assignment.worker.name,
        project: assignment.project.name,
        tool: tool.name,
      });
    });

    if (assignment.checkinDate) {
      assignment.tools.forEach(tool => {
        activityLog.push({
          date: assignment.checkinDate!,
          action: 'Check-in',
          worker: assignment.worker.name,
          project: assignment.project.name,
          tool: tool.name,
        });
      });
    }
  });

  activityLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Summary statistics
  const totalCheckouts = filteredAssignments.length;
  const totalCheckins = filteredAssignments.filter(a => a.status === 'completed').length;
  const toolsCheckedOut = filteredAssignments.reduce((sum, a) => sum + a.tools.length, 0);
  const toolsReturned = filteredAssignments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + a.tools.length, 0);
  const currentlyActive = tools.filter(t => t.status === 'In Use').length;

  // Category breakdown
  const categoryBreakdown = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = {
        available: 0,
        inUse: 0,
        damaged: 0,
        lost: 0,
        total: 0,
      };
    }
    acc[tool.category].total++;
    if (tool.status === 'Available') acc[tool.category].available++;
    else if (tool.status === 'In Use') acc[tool.category].inUse++;
    else if (tool.status === 'Damaged') acc[tool.category].damaged++;
    else if (tool.status === 'Lost') acc[tool.category].lost++;
    return acc;
  }, {} as Record<string, { available: number; inUse: number; damaged: number; lost: number; total: number }>);

  const handleExportCSV = () => {
    const csvContent = [
      ['Date/Time', 'Action', 'Worker', 'Project', 'Tool'],
      ...activityLog.map(log => [
        new Date(log.date).toLocaleString(),
        log.action,
        log.worker,
        log.project,
        log.tool,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tool-room-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Pagination for Activity Log
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedLog = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return activityLog.slice(start, end);
  }, [activityLog, currentPage]);
  const totalPages = Math.ceil(activityLog.length / itemsPerPage);

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View activity logs and inventory status</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="print:hidden">
        <h1 className="text-2xl font-bold hidden print:block mb-4">Tool Room Report</h1>
      </div>

      {/* Date Range Selector */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {startDate.toLocaleDateString()} - {today.toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityLog.length}</div>
            <p className="text-xs text-muted-foreground">Checkouts + Check-ins</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tools Checked Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{toolsCheckedOut}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tools Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{toolsReturned}</div>
            <p className="text-xs text-muted-foreground">Successfully checked in</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{currentlyActive}</div>
            <p className="text-xs text-muted-foreground">Tools in use now</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent tool checkout and check-in activities</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLog.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activities in this date range</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Tool</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLog.map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.action === 'Checkout'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.worker}</TableCell>
                      <TableCell>{log.project}</TableCell>
                      <TableCell>{log.tool}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Status by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Inventory Status</CardTitle>
          <CardDescription>Breakdown by category with visual progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, stats]) => (
              <div key={category}>
                <h3 className="text-md font-medium mb-2">{category} ({stats.total} total)</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <span className="text-sm font-medium">{stats.available}</span>
                  </div>
                  <Progress value={(stats.available / stats.total) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">In Use</span>
                    <span className="text-sm font-medium">{stats.inUse}</span>
                  </div>
                  <Progress value={(stats.inUse / stats.total) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Damaged</span>
                    <span className="text-sm font-medium">{stats.damaged}</span>
                  </div>
                  <Progress value={(stats.damaged / stats.total) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lost</span>
                    <span className="text-sm font-medium">{stats.lost}</span>
                  </div>
                  <Progress value={(stats.lost / stats.total) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
