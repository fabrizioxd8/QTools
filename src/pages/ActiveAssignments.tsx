import { useState } from 'react';
import { Calendar, User, Folder, AlertCircle, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
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
import { useAppData, Assignment, ToolConditionString } from '@/contexts/AppDataContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ActiveAssignments() {
  const { t } = useTranslation();
  const { assignments, checkInAssignment } = useAppData();
  const [checkInDialog, setCheckInDialog] = useState<Assignment | null>(null);
  const [toolConditions, setToolConditions] = useState<Record<number, Record<'good' | 'damaged' | 'lost' | 'missing', number>>>({});
  const [editingCompletedAssignment, setEditingCompletedAssignment] = useState<Assignment | null>(null);
  const [checkinNotes, setCheckinNotes] = useState('');
  const [returnGuide, setReturnGuide] = useState('');
  // Check-in date (YYYY-MM-DD) defaulting to today
  const [checkinDate, setCheckinDate] = useState<string>(() => {
    const d = new Date();
    // Use local date to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  // Check-in time (HH:MM) default to now
  const [checkinTime, setCheckinTime] = useState<string>(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  });
  const checkInTopRef = useState<HTMLDivElement | null>(null)[0] as unknown as React.RefObject<HTMLDivElement>;

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
    const initialConditions: Record<number, Record<'good' | 'damaged' | 'lost' | 'missing', number>> = {};
    assignment.tools.forEach(tool => {
      initialConditions[tool.id] = {
        good: tool.quantity || 1,
        damaged: 0,
        lost: 0,
        missing: 0,
      };
    });
    setToolConditions(initialConditions);
    setCheckinNotes('');
    setReturnGuide(assignment.guiaNumber || '');
    // Reset check-in date to today when opening dialog
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCheckinDate(`${year}-${month}-${day}`);
    // default time to now when opening
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    setCheckinTime(`${hh}:${mm}:${ss}`);
    // ensure dialog scroll/focus at top after open
    setTimeout(() => {
      const el = document.getElementById('checkin-top');
      if (el && 'focus' in el) (el as HTMLElement).focus();
      const scrollable = el?.closest('[role="dialog"]') as HTMLElement | null;
      if (scrollable) scrollable.scrollTop = 0;
    }, 0);
  };

  const handleCheckIn = async () => {
    if (checkInDialog) {
      try {
        // Validate quantities match total
        for (const tool of checkInDialog.tools) {
          const sum = Object.values(toolConditions[tool.id] || {}).reduce((a, b) => Number(a) + Number(b), 0);
          const expected = tool.quantity || 1;
          if (sum !== expected) {
            toast.error(t('assignments.quantityMismatch', { name: tool.name, expected, sum }));
            return;
          }
        }

        // Build ISO datetime from selected date+time
        let checkinDateTime: string | undefined;
        if (checkinDate) {
          const [year, month, day] = checkinDate.split('-').map(Number);
          const [hour, minute, second] = (checkinTime || '00:00:00').split(':').map(Number);
          checkinDateTime = new Date(year, month - 1, day, hour ?? 0, minute ?? 0, second ?? 0).toISOString();
        }

        await checkInAssignment(checkInDialog.id, checkinDateTime, checkinNotes, toolConditions, returnGuide.trim() || undefined);
        toast.success(t('assignments.checkInSuccess'));
        setCheckInDialog(null);
        setCheckinNotes('');
        setReturnGuide('');
        setToolConditions({});
      } catch (error) {
        toast.error(t('assignments.checkInFailed'));
        console.error('Error checking in assignment:', error);
      }
    }
  };

  const handleEditCheckIn = async () => {
    if (editingCompletedAssignment) {
      try {
        // Validate quantities match total
        for (const tool of editingCompletedAssignment.tools) {
          const sum = Object.values(toolConditions[tool.id] || {}).reduce((a, b) => Number(a) + Number(b), 0);
          const expected = tool.quantity || 1;
          if (sum !== expected) {
            toast.error(t('assignments.quantityMismatch', { name: tool.name, expected, sum }));
            return;
          }
        }

        let checkinDateTime: string | undefined;
        if (checkinDate) {
          const [year, month, day] = checkinDate.split('-').map(Number);
          const [hour, minute, second] = (checkinTime || '00:00:00').split(':').map(Number);
          checkinDateTime = new Date(year, month - 1, day, hour ?? 0, minute ?? 0, second ?? 0).toISOString();
        }

        await checkInAssignment(editingCompletedAssignment.id, checkinDateTime, checkinNotes, toolConditions, returnGuide.trim() || undefined);
        toast.success(t('assignments.checkInUpdatedSuccess'));
        setEditingCompletedAssignment(null);
        setCheckinNotes('');
        setReturnGuide('');
        setToolConditions({});
      } catch (error) {
        toast.error(t('assignments.checkInUpdateFailed'));
        console.error('Error updating check-in:', error);
      }
    }
  };

  const getConditionIcon = (condition: 'good' | 'damaged' | 'lost' | 'missing') => {
    switch (condition) {
      case 'good': return CheckCircle;
      case 'damaged': return AlertCircle;
      case 'lost': return XCircle;
      case 'missing': return Clock;
    }
  };

  const getConditionBadgeClass = (condition: 'good' | 'damaged' | 'lost' | 'missing') => {
    switch (condition) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200/60 dark:border-green-700/40';
      case 'damaged':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200/60 dark:border-red-700/40';
      case 'lost':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/40';
      case 'missing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200/60 dark:border-yellow-700/40';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const tCondition = (cond: string) => {
    switch (cond) {
      case 'good': return t('assignments.conditionGood');
      case 'damaged': return t('assignments.conditionDamaged');
      case 'lost': return t('assignments.conditionLost');
      case 'missing': return t('assignments.conditionMissing');
      default: return cond;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("assignments.title")}</h1>
        <p className="text-muted-foreground">{t("assignments.subtitle")}</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">{t("assignments.activeTab")}</TabsTrigger>
          <TabsTrigger value="completed">{t("assignments.completedTab")}</TabsTrigger>
        </TabsList>

        {/* Active Assignments */}
        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t("assignments.activeCount")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{activeAssignments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t("assignments.toolsCheckedOut")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">
                  {activeAssignments.reduce((sum, a) => sum + a.tools.reduce((s, t) => s + (t.quantity || 1), 0), 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t("assignments.workersWithTools")}</CardTitle>
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
                <p className="text-center text-muted-foreground">{t("assignments.noActiveAssignments")}</p>
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
                            <Badge>{t("assignments.assignmentId", { id: assignment.id })}</Badge>
                            {isLongCheckout && (
                              <Badge variant="destructive">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                {t('assignments.daysOut', { count: daysOut })}
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
                          {t('assignments.checkIn')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold mb-2">{t('assignments.tools')} ({assignment.tools.length})</p>
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
                            <p className="font-semibold mb-1">{t('assignments.checkoutNotes')}</p>
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
                <CardTitle className="text-sm font-medium">{t("assignments.totalCompleted")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedAssignments.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t("assignments.toolsReturned")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {completedAssignments.reduce((sum, a) => sum + a.tools.reduce((s, t) => s + (t.quantity || 1), 0), 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t("assignments.avgDaysOut")}</CardTitle>
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
                <p className="text-center text-muted-foreground">{t("assignments.noCompletedAssignments")}</p>
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
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <Badge>{t("assignments.assignmentId", { id: assignment.id })}</Badge>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {t('assignments.out')}: {new Date(assignment.checkoutDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {t('assignments.in')}: {assignment.checkinDate && new Date(assignment.checkinDate).toLocaleDateString()}
                            </div>
                            <Badge variant="outline">{t('assignments.daysOut', { count: duration })}</Badge>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCompletedAssignment(assignment);
                            // Normalize toolConditions: handle both legacy string format
                            // and new per-condition quantity map format
                            const normalized: Record<number, Record<'good' | 'damaged' | 'lost' | 'missing', number>> = {};
                            assignment.tools.forEach(tool => {
                              const stored = assignment.toolConditions?.[tool.id];
                              const expected = tool.quantity || 1;
                              if (!stored) {
                                // No condition stored — default all to good
                                normalized[tool.id] = { good: expected, damaged: 0, lost: 0, missing: 0 };
                              } else if (typeof stored === 'string') {
                                // Legacy: single string condition for the whole quantity
                                normalized[tool.id] = {
                                  good: stored === 'good' ? expected : 0,
                                  damaged: stored === 'damaged' ? expected : 0,
                                  lost: stored === 'lost' ? expected : 0,
                                  missing: stored === 'missing' ? expected : 0,
                                };
                              } else {
                                // New format: already a map — ensure all keys are numbers
                                normalized[tool.id] = {
                                  good: Number(stored.good) || 0,
                                  damaged: Number(stored.damaged) || 0,
                                  lost: Number(stored.lost) || 0,
                                  missing: Number(stored.missing) || 0,
                                };
                              }
                            });
                            setToolConditions(normalized);
                            setCheckinNotes(assignment.checkinNotes || '');
                            setReturnGuide(assignment.return_guide || assignment.guiaNumber || '');
                            if (assignment.checkinDate) {
                              const date = new Date(assignment.checkinDate);
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setCheckinDate(`${year}-${month}-${day}`);
                              const hh = String(date.getHours()).padStart(2, '0');
                              const mm = String(date.getMinutes()).padStart(2, '0');
                              const ss = String(date.getSeconds()).padStart(2, '0');
                              setCheckinTime(`${hh}:${mm}:${ss}`);
                            }
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t('assignments.editCheckIn')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold mb-2">{t('assignments.tools')}:</p>
                          <div className="flex flex-wrap gap-2">
                            {assignment.tools.map(tool => {
                              const conditions = assignment.toolConditions?.[tool.id];

                              if (!conditions || typeof conditions === 'string') {
                                const cond = (conditions as unknown as string) || 'good';
                                const Icon = getConditionIcon(cond as ToolConditionString);
                                return (
                                  <Badge key={tool.id} className={getConditionBadgeClass(cond as ToolConditionString)}>
                                    <Icon className="mr-1 h-3 w-3" />
                                    {tool.name} ({tCondition(cond)})
                                    {tool.quantity && tool.quantity > 1 ? ` (${tool.quantity})` : ''}
                                  </Badge>
                                );
                              }

                              return Object.entries(conditions as Record<string, number>)
                                .filter(([_, qty]) => qty > 0)
                                .map(([cond, qty]) => {
                                  const Icon = getConditionIcon(cond as ToolConditionString);
                                  return (
                                    <Badge key={`${tool.id}-${cond}`} className={getConditionBadgeClass(cond as ToolConditionString)}>
                                      <Icon className="mr-1 h-3 w-3" />
                                      {tool.name} ({tCondition(cond)}: {qty})
                                    </Badge>
                                  );
                                });
                            })}
                          </div>
                        </div>

                        {assignment.checkoutNotes && (
                          <div>
                            <p className="font-semibold mb-1">{t('assignments.checkoutNotes')}</p>
                            <p className="text-sm text-muted-foreground">{assignment.checkoutNotes}</p>
                          </div>
                        )}

                        {assignment.checkinNotes && (
                          <div>
                            <p className="font-semibold mb-1">{t('assignments.checkinNotes')}</p>
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
            <DialogTitle>{t("assignments.checkInTitle")}</DialogTitle>
            <DialogDescription>
              {t('assignments.checkInDesc')}
            </DialogDescription>
          </DialogHeader>

          {checkInDialog && (
            <div className="space-y-6">
              {checkInDialog.tools.map((tool, idx) => (
                <div key={tool.id} className="space-y-3 pb-4 border-b last:border-0">
                  <div>
                    <Label id={idx === 0 ? 'checkin-top' : undefined} tabIndex={idx === 0 ? -1 : undefined} className="text-base font-semibold">{tool.name} {tool.quantity && tool.quantity > 1 ? `(${tool.quantity})` : ''}</Label>
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
                  {(() => {
                    const expected = tool.quantity || 1;
                    const conditions = toolConditions[tool.id] || { good: 0, damaged: 0, lost: 0, missing: 0 };
                    const sum = Object.values(conditions).reduce((a, b) => Number(a) + Number(b), 0);
                    const isOver = sum > expected;
                    const isMismatch = sum !== expected;
                    return (
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">{t("assignments.toolConditionQuantities")}</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {(['good', 'missing', 'damaged', 'lost'] as const).map((cond) => (
                            <div key={cond} className="space-y-1">
                              <div className="flex items-center gap-2">
                                {cond === 'good' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {cond === 'missing' && <Clock className="h-4 w-4 text-yellow-600" />}
                                {cond === 'damaged' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                                {cond === 'lost' && <XCircle className="h-4 w-4 text-red-600" />}
                                <Label htmlFor={`${tool.id}-${cond}`} className="capitalize">{tCondition(cond)}</Label>
                              </div>
                              <Input
                                id={`${tool.id}-${cond}`}
                                type="number"
                                min={0}
                                max={expected}
                                value={conditions[cond] ?? 0}
                                className={isOver ? 'border-destructive focus-visible:ring-destructive' : ''}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  const val = Math.min(Math.max(0, isNaN(parsed) ? 0 : parsed), expected);
                                  setToolConditions(prev => ({
                                    ...prev,
                                    [tool.id]: { ...prev[tool.id], [cond]: val }
                                  }));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        {isOver && (
                          <p className="text-xs text-destructive font-medium">
                            {t("assignments.totalExceeds", { sum, expected })}
                          </p>
                        )}
                        {!isOver && isMismatch && (
                          <p className="text-xs text-destructive">
                            {t("assignments.totalMismatch", { sum, expected })}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('assignments.checkinDate')}</Label>
                  <div className="flex items-center">
                    <Input
                      type="date"
                      value={checkinDate}
                      onChange={(e) => setCheckinDate(e.target.value)}
                      className="w-auto h-11 max-w-[200px]"
                    />
                    <div className="ml-4">
                      <Label className="sr-only" htmlFor="checkin-time">{t('assignments.checkinTime')}</Label>
                      <Input
                        id="checkin-time"
                        type="time"
                        step="1"
                        value={checkinTime}
                        onChange={(e) => setCheckinTime(e.target.value)}
                        className="w-auto h-11 max-w-[140px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Guía de Retorno</Label>
                  <Input
                    placeholder="Número de guía de retorno"
                    value={returnGuide}
                    onChange={(e) => setReturnGuide(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pre-cargado con la guía de salida. Modifique si es necesario.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("assignments.notesOptional")}</Label>
                  <Textarea
                    placeholder={t("assignments.notesPlaceholder")}
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialog(null)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCheckIn}
              disabled={
                !checkInDialog ||
                checkInDialog.tools.some(tool => {
                  const sum = Object.values(toolConditions[tool.id] || {}).reduce((a, b) => Number(a) + Number(b), 0);
                  return sum !== (tool.quantity || 1);
                })
              }
            >
              {t('assignments.confirmCheckIn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Check-In Dialog */}
      <Dialog open={editingCompletedAssignment !== null} onOpenChange={() => setEditingCompletedAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("assignments.editCheckInTitle")}</DialogTitle>
            <DialogDescription>
              {t('assignments.editCheckInDesc')}
            </DialogDescription>
          </DialogHeader>

          {editingCompletedAssignment && (
            <div className="space-y-6">
              {editingCompletedAssignment.tools.map(tool => (
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
                  {(() => {
                    const expected = tool.quantity || 1;
                    const conditions = toolConditions[tool.id] || { good: 0, damaged: 0, lost: 0, missing: 0 };
                    const sum = Object.values(conditions).reduce((a, b) => Number(a) + Number(b), 0);
                    const isOver = sum > expected;
                    const isMismatch = sum !== expected;
                    return (
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold">{t("assignments.toolConditionQuantities")}</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {(['good', 'missing', 'damaged', 'lost'] as const).map((cond) => (
                            <div key={cond} className="space-y-1">
                              <div className="flex items-center gap-2">
                                {cond === 'good' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {cond === 'missing' && <Clock className="h-4 w-4 text-yellow-600" />}
                                {cond === 'damaged' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                                {cond === 'lost' && <XCircle className="h-4 w-4 text-red-600" />}
                                <Label htmlFor={`edit-${tool.id}-${cond}`} className="capitalize">{tCondition(cond)}</Label>
                              </div>
                              <Input
                                id={`edit-${tool.id}-${cond}`}
                                type="number"
                                min={0}
                                max={expected}
                                value={conditions[cond] ?? 0}
                                className={isOver ? 'border-destructive focus-visible:ring-destructive' : ''}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  const val = Math.min(Math.max(0, isNaN(parsed) ? 0 : parsed), expected);
                                  setToolConditions(prev => ({
                                    ...prev,
                                    [tool.id]: { ...prev[tool.id], [cond]: val }
                                  }));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        {isOver && (
                          <p className="text-xs text-destructive font-medium">
                            {t("assignments.totalExceeds", { sum, expected })}
                          </p>
                        )}
                        {!isOver && isMismatch && (
                          <p className="text-xs text-destructive">
                            {t("assignments.totalMismatch", { sum, expected })}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('assignments.checkinDate')}</Label>
                  <div className="flex items-center">
                    <Input
                      type="date"
                      value={checkinDate}
                      onChange={(e) => setCheckinDate(e.target.value)}
                      className="w-auto h-11 max-w-[200px]"
                    />
                    <div className="ml-4">
                      <Label className="sr-only" htmlFor="edit-checkin-time">{t('assignments.checkinTime')}</Label>
                      <Input
                        id="edit-checkin-time"
                        type="time"
                        step="1"
                        value={checkinTime}
                        onChange={(e) => setCheckinTime(e.target.value)}
                        className="w-auto h-11 max-w-[140px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Guía de Retorno</Label>
                  <Input
                    placeholder="Número de guía de retorno"
                    value={returnGuide}
                    onChange={(e) => setReturnGuide(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pre-cargado con la guía de salida. Modifique si es necesario.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("assignments.notesOptional")}</Label>
                  <Textarea
                    placeholder={t("assignments.notesPlaceholder")}
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCompletedAssignment(null)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleEditCheckIn}
              disabled={
                !editingCompletedAssignment ||
                editingCompletedAssignment.tools.some(tool => {
                  const sum = Object.values(toolConditions[tool.id] || {}).reduce((a, b) => Number(a) + Number(b), 0);
                  return sum !== (tool.quantity || 1);
                })
              }
            >
              {t('assignments.updateCheckIn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
