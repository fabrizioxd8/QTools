import { useState } from 'react';
import { Calendar, User, Folder, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppData, Assignment } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

export default function ActiveAssignments() {
  const { assignments, checkInAssignment } = useAppData();
  const [checkInDialog, setCheckInDialog] = useState<Assignment | null>(null);
  const [toolConditions, setToolConditions] = useState<Record<number, 'good' | 'damaged' | 'lost'>>({});
  const [checkinNotes, setCheckinNotes] = useState('');
  // Check-in date (YYYY-MM-DD) defaulting to today
  const [checkinDate, setCheckinDate] = useState<string>(() => {
    const d = new Date();
    // Use local date to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const activeAssignments = assignments
    .filter(a => a.status === 'active')
    .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime());

  const completedAssignments = assignments
    .filter(a => a.status === 'completed')
    .sort((a, b) => {
      // Sort by check-in date DESC (most recent first)
      const aDate = a.checkinDate ? new Date(a.checkinDate).getTime() : 0;
      const bDate = b.checkinDate ? new Date(b.checkinDate).getTime() : 0;
      return bDate - aDate;
    });

  const getDaysOut = (checkoutDate: string) => {
    const today = new Date();
    const checkout = new Date(checkoutDate);

    // Reset time to avoid timezone issues
    today.setHours(0, 0, 0, 0);
    checkout.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - checkout.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days); // Ensure we don't return negative days
  };

  const openCheckInDialog = (assignment: Assignment) => {
    setCheckInDialog(assignment);
    const initialConditions: Record<number, 'good' | 'damaged' | 'lost'> = {};
    assignment.tools.forEach(tool => {
      initialConditions[tool.id] = 'good';
    });
    setToolConditions(initialConditions);
    setCheckinNotes('');
    // Reset check-in date to today when opening dialog
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCheckinDate(`${year}-${month}-${day}`);
  };

  const handleCheckIn = async () => {
    if (checkInDialog) {
      try {
        await checkInAssignment(checkInDialog.id, checkinDate, checkinNotes, toolConditions);
        toast.success('Tools checked in successfully!');
        setCheckInDialog(null);
        setCheckinNotes('');
        setToolConditions({});
      } catch (error) {
        toast.error('Failed to check in tools. Please try again.');
        console.error('Error checking in assignment:', error);
      }
    }
  };

  const getConditionIcon = (condition: 'good' | 'damaged' | 'lost') => {
    switch (condition) {
      case 'good': return CheckCircle;
      case 'damaged': return AlertCircle;
      case 'lost': return XCircle;
    }
  };

  const getConditionBadgeClass = (condition: 'good' | 'damaged' | 'lost') => {
    switch (condition) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200/60 dark:border-green-700/40';
      case 'damaged':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200/60 dark:border-red-700/40';
      case 'lost':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/40';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">Track active and completed tool assignments</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Assignments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Active Assignments */}
        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{activeAssignments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tools Checked Out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">
                  {activeAssignments.reduce((sum, a) => sum + a.tools.length, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Workers with Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500">
                  {new Set(activeAssignments.map(a => a.worker.id)).size}
                </div>
              </CardContent>
            </Card>
          </div>

          {activeAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">No active assignments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map(assignment => {
                const daysOut = getDaysOut(assignment.checkoutDate);
                const isLongCheckout = daysOut > 7;

                return (
                  <Card key={assignment.id} className={isLongCheckout ? 'border-warning' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge>Assignment #{assignment.id}</Badge>
                            {isLongCheckout && (
                              <Badge variant="destructive">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                {daysOut} day{daysOut !== 1 ? 's' : ''} out
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(assignment.checkoutDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {assignment.worker.name} ({assignment.worker.employeeId})
                            </div>
                            <div className="flex items-center gap-1">
                              <Folder className="h-4 w-4" />
                              {assignment.project.name}
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => openCheckInDialog(assignment)}>
                          Check In
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold mb-2">Tools ({assignment.tools.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {assignment.tools.map(tool => (
                              <Badge key={tool.id} variant="outline">
                                {tool.name}
                                {tool.quantity && tool.quantity > 1 && ` (${tool.quantity})`}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {assignment.checkoutNotes && (
                          <div>
                            <p className="font-semibold mb-1">Checkout Notes:</p>
                            <p className="text-sm text-muted-foreground">{assignment.checkoutNotes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Completed Assignments */}
        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedAssignments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tools Returned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {completedAssignments.reduce((sum, a) => sum + a.tools.length, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg. Days Out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {completedAssignments.length > 0
                    ? Math.round(
                      completedAssignments.reduce((sum, a) => {
                        if (a.checkinDate) {
                          return sum + (new Date(a.checkinDate).getTime() - new Date(a.checkoutDate).getTime()) / (1000 * 60 * 60 * 24);
                        }
                        return sum;
                      }, 0) / completedAssignments.length
                    )
                    : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {completedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">No completed assignments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedAssignments.map(assignment => {
                const duration = assignment.checkinDate
                  ? Math.floor((new Date(assignment.checkinDate).getTime() - new Date(assignment.checkoutDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="space-y-1">
                        <Badge>Assignment #{assignment.id}</Badge>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Out: {new Date(assignment.checkoutDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            In: {assignment.checkinDate && new Date(assignment.checkinDate).toLocaleDateString()}
                          </div>
                          <Badge variant="outline">{duration} days</Badge>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {assignment.worker.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Folder className="h-4 w-4" />
                            {assignment.project.name}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold mb-2">Tools:</p>
                          <div className="flex flex-wrap gap-2">
                            {assignment.tools.map(tool => {
                              const condition = assignment.toolConditions?.[tool.id] || 'good';
                              const ConditionIcon = getConditionIcon(condition);

                              return (
                                <Badge key={tool.id} className={getConditionBadgeClass(condition)}>
                                  <ConditionIcon className="mr-1 h-3 w-3" />
                                  {tool.name} ({condition})
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        {assignment.checkoutNotes && (
                          <div>
                            <p className="font-semibold mb-1">Checkout Notes:</p>
                            <p className="text-sm text-muted-foreground">{assignment.checkoutNotes}</p>
                          </div>
                        )}

                        {assignment.checkinNotes && (
                          <div>
                            <p className="font-semibold mb-1">Check-in Notes:</p>
                            <p className="text-sm text-muted-foreground">{assignment.checkinNotes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Check In Dialog */}
      <Dialog open={checkInDialog !== null} onOpenChange={() => setCheckInDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check In Tools</DialogTitle>
            <DialogDescription>
              Review each tool's condition and add any notes
            </DialogDescription>
          </DialogHeader>

          {checkInDialog && (
            <div className="space-y-6">
              {checkInDialog.tools.map(tool => (
                <div key={tool.id} className="space-y-3 pb-4 border-b last:border-0">
                  <div>
                    <Label className="text-base font-semibold">{tool.name}</Label>
                    {Object.entries(tool.customAttributes).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(tool.customAttributes).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${tool.id}-status-change`}
                        checked={toolConditions[tool.id] === 'good'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setToolConditions({ ...toolConditions, [tool.id]: 'good' });
                          } else {
                            setToolConditions({ ...toolConditions, [tool.id]: 'damaged' });
                          }
                        }}
                      />
                      <Label htmlFor={`${tool.id}-status-change`} className="cursor-pointer flex items-center">
                        <CheckCircle className="mr-1 h-4 w-4 text-success" />
                        Tool is in good condition
                      </Label>
                    </div>

                    {toolConditions[tool.id] !== 'good' && (
                      <div className="ml-6 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Select condition:</p>
                        <RadioGroup
                          value={toolConditions[tool.id]}
                          onValueChange={(value: 'damaged' | 'lost') =>
                            setToolConditions({ ...toolConditions, [tool.id]: value })
                          }
                        >
                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="damaged" id={`${tool.id}-damaged`} />
                              <Label htmlFor={`${tool.id}-damaged`} className="cursor-pointer flex items-center">
                                <AlertCircle className="mr-1 h-4 w-4 text-warning" />
                                Damaged
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="lost" id={`${tool.id}-lost`} />
                              <Label htmlFor={`${tool.id}-lost`} className="cursor-pointer flex items-center">
                                <XCircle className="mr-1 h-4 w-4 text-destructive" />
                                Lost
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Check-in Date</Label>
                  <div className="flex items-center">
                    <Input
                      type="date"
                      value={checkinDate}
                      onChange={(e) => setCheckinDate(e.target.value)}
                      className="w-auto h-11 max-w-[200px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any additional notes about this check-in..."
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialog(null)}>Cancel</Button>
            <Button onClick={handleCheckIn}>Confirm Check-In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
