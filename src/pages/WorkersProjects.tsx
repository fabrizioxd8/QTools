import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Folder, Wrench, User, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppData, Worker, Project } from '@/contexts/AppDataContext';
import { matchesSearch } from '@/lib/search';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

export default function WorkersProjects() {
  const { workers, projects, assignments, addWorker, updateWorker, deleteWorker, addProject, updateProject, deleteProject } = useAppData();
  const { t } = useTranslation();

  const [expandedWorkerIds, setExpandedWorkerIds] = useState<number[]>([]);
  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);
  const toggleWorkerExpand = (id: number) => {
    setExpandedWorkerIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleProjectExpand = (id: number) => {
    setExpandedProjectIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const workerSearchInputRef = useRef<HTMLInputElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'workers' | 'projects'>('workers');

  // Worker state
  const [isWorkerDialogOpen, setIsWorkerDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerFormData, setWorkerFormData] = useState({ name: '', employeeId: '' });
  const [workerSearch, setWorkerSearch] = useState('');
  const [deleteWorkerConfirm, setDeleteWorkerConfirm] = useState<number | null>(null);

  // Project state
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({ name: '' });
  const [projectSearch, setProjectSearch] = useState('');
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState<number | null>(null);

  // Worker sort controls
  const [workerSortField, setWorkerSortField] = useState<'name' | null>(null);
  const [workerSortDirection, setWorkerSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleWorkerSort = (field: 'name') => {
    if (workerSortField === field) {
      if (workerSortDirection === 'asc') setWorkerSortDirection('desc');
      else { setWorkerSortField(null); setWorkerSortDirection('asc'); }
    } else {
      setWorkerSortField(field);
      setWorkerSortDirection('asc');
    }
  };

  const getWorkerSortIcon = (field: 'name') => {
    if (workerSortField !== field) return ArrowUpDown;
    return workerSortDirection === 'asc' ? ArrowUp : ArrowDown;
  };

  // Project sort controls
  const [projectSortField, setProjectSortField] = useState<'name' | null>(null);
  const [projectSortDirection, setProjectSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleProjectSort = (field: 'name') => {
    if (projectSortField === field) {
      if (projectSortDirection === 'asc') setProjectSortDirection('desc');
      else { setProjectSortField(null); setProjectSortDirection('asc'); }
    } else {
      setProjectSortField(field);
      setProjectSortDirection('asc');
    }
  };

  const getProjectSortIcon = (field: 'name') => {
    if (projectSortField !== field) return ArrowUpDown;
    return projectSortDirection === 'asc' ? ArrowUp : ArrowDown;
  };

  // Worker functions
  const openWorkerDialog = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setWorkerFormData({ name: worker.name, employeeId: worker.employeeId });
    } else {
      setEditingWorker(null);
      setWorkerFormData({ name: '', employeeId: '' });
    }
    setIsWorkerDialogOpen(true);
  };

  const handleWorkerSubmit = async () => {
    if (!workerFormData.name || !workerFormData.employeeId) {
      toast.error(t('workersProjects.requiredFields'));
      return;
    }
    try {
      if (editingWorker) {
        await updateWorker(editingWorker.id, workerFormData);
        toast.success(t('workersProjects.workerUpdatedSuccess'));
      } else {
        await addWorker(workerFormData);
        toast.success(t('workersProjects.workerAddedSuccess'));
      }
      setIsWorkerDialogOpen(false);
    } catch (error) {
      toast.error(t('workersProjects.workerSaveFailed'));
      console.error('Error saving worker:', error);
    }
  };

  const handleWorkerDelete = async (id: number) => {
    try {
      await deleteWorker(id);
      toast.success(t('workersProjects.workerDeletedSuccess'));
      setDeleteWorkerConfirm(null);
    } catch (error) {
      toast.error(t('workersProjects.workerDeleteFailed'));
      console.error('Error deleting worker:', error);
    }
  };

  // Project functions
  const openProjectDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectFormData({ name: project.name });
    } else {
      setEditingProject(null);
      setProjectFormData({ name: '' });
    }
    setIsProjectDialogOpen(true);
  };

  const handleProjectSubmit = async () => {
    if (!projectFormData.name) {
      toast.error(t('workersProjects.requiredProjectName'));
      return;
    }
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectFormData);
        toast.success(t('workersProjects.projectUpdatedSuccess'));
      } else {
        await addProject(projectFormData);
        toast.success(t('workersProjects.projectAddedSuccess'));
      }
      setIsProjectDialogOpen(false);
    } catch (error) {
      toast.error(t('workersProjects.projectSaveFailed'));
      console.error('Error saving project:', error);
    }
  };

  const handleProjectDelete = async (id: number) => {
    try {
      await deleteProject(id);
      toast.success(t('workersProjects.projectDeletedSuccess'));
      setDeleteProjectConfirm(null);
    } catch (error) {
      toast.error(t('workersProjects.projectDeleteFailed'));
      console.error('Error deleting project:', error);
    }
  };

  const workerStats = useMemo(() => {
    const stats = new Map<number, { projectCount: number; toolCount: number }>();
    const projectSet = new Map<number, Set<number>>();
    assignments.forEach(assignment => {
      if (assignment.status === 'active') {
        const workerId = assignment.worker.id;
        if (!projectSet.has(workerId)) projectSet.set(workerId, new Set());
        projectSet.get(workerId)!.add(assignment.project.id);
        const currentStats = stats.get(workerId) || { projectCount: 0, toolCount: 0 };
        currentStats.toolCount += assignment.tools.length;
        stats.set(workerId, currentStats);
      }
    });
    projectSet.forEach((projects, workerId) => {
      const currentStats = stats.get(workerId) || { projectCount: 0, toolCount: 0 };
      currentStats.projectCount = projects.size;
      stats.set(workerId, currentStats);
    });
    return stats;
  }, [assignments]);

  const sortedAndFilteredWorkers = useMemo(() => {
    const sortableWorkers = workers.map(w => ({
      ...w,
      ...(workerStats.get(w.id) || { projectCount: 0, toolCount: 0 })
    }));
    if (workerSortField !== null) {
      sortableWorkers.sort((a, b) => {
        const aValue = a[workerSortField];
        const bValue = b[workerSortField];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const aLower = aValue.toLowerCase();
          const bLower = bValue.toLowerCase();
          if (aLower < bLower) return workerSortDirection === 'asc' ? -1 : 1;
          if (aLower > bLower) return workerSortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableWorkers.filter(w =>
      matchesSearch(w.name, workerSearch) || matchesSearch(w.employeeId, workerSearch)
    );
  }, [workers, workerSearch, workerSortField, workerSortDirection, workerStats]);

  const filteredProjects = projects
    .filter(p => matchesSearch(p.name, projectSearch))
    .sort((a, b) => {
      if (!projectSortField) return 0;
      let aValue = a[projectSortField];
      let bValue = b[projectSortField];
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return projectSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return projectSortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        if (activeTab === 'workers') workerSearchInputRef.current?.focus();
        else projectSearchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('workersProjects.title')}</h1>
        <p className="text-muted-foreground">{t('workersProjects.subtitle')}</p>
      </div>

      <Tabs defaultValue="workers" className="space-y-4" onValueChange={(value) => setActiveTab(value as 'workers' | 'projects')}>
        <TabsList>
          <TabsTrigger value="workers">{t('workersProjects.workers')}</TabsTrigger>
          <TabsTrigger value="projects">{t('workersProjects.projects')}</TabsTrigger>
        </TabsList>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('workersProjects.workers')}</CardTitle>
                <Button onClick={() => openWorkerDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('workersProjects.addWorker')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={workerSearchInputRef}
                    placeholder={t('workersProjects.searchWorkers')}
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {sortedAndFilteredWorkers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('workersProjects.noWorkersFound')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                            onClick={() => handleWorkerSort('name')}
                          >
                            {t('common.name')}
                            {(() => { const Icon = getWorkerSortIcon('name'); return <Icon className="ml-2 h-4 w-4" />; })()}
                          </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">{t('workersProjects.employeeIdLabel')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('workersProjects.assignedProjects')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('workersProjects.assignedTools')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredWorkers.map(worker => (
                        <>
                          <TableRow key={worker.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <button
                                    className="flex items-center text-left w-full truncate md:cursor-auto"
                                    onClick={() => toggleWorkerExpand(worker.id)}
                                    {...(expandedWorkerIds.includes(worker.id)
                                      ? { 'aria-expanded': true, 'aria-controls': `details-${worker.id}` }
                                      : { 'aria-expanded': false })}
                                  >
                                    <span className="block truncate">{worker.name}</span>
                                    <span
                                      className={`ml-2 inline-block md:hidden transform transition-transform duration-150 ${expandedWorkerIds.includes(worker.id) ? 'rotate-180' : ''}`}
                                      aria-hidden
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{worker.employeeId}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-muted-foreground" /> {worker.projectCount}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-muted-foreground" /> {worker.toolCount}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openWorkerDialog(worker)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteWorkerConfirm(worker.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedWorkerIds.includes(worker.id) && (
                            <TableRow id={`details-${worker.id}`}>
                              <TableCell className="md:hidden" colSpan={5} role="region">
                                <div className="space-y-2">
                                  <div className="text-sm"><strong>{t('workersProjects.employeeIdLabel')}:</strong> {worker.employeeId}</div>
                                  <div className="text-sm"><strong>{t('workersProjects.assignedProjects')}:</strong> {worker.projectCount}</div>
                                  <div className="text-sm"><strong>{t('workersProjects.assignedTools')}:</strong> {worker.toolCount}</div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('workersProjects.projects')}</CardTitle>
                <Button onClick={() => openProjectDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('workersProjects.addProject')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={projectSearchInputRef}
                    placeholder={t('workersProjects.searchProjects')}
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('workersProjects.noProjectsFound')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                            onClick={() => handleProjectSort('name')}
                          >
                            {t('workersProjects.projectNameLabel')}
                            {(() => { const Icon = getProjectSortIcon('name'); return <Icon className="ml-2 h-4 w-4" />; })()}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map(project => (
                        <>
                          <TableRow key={project.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium min-w-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                                  <Folder className="h-4 w-4 text-secondary-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <button
                                    className="flex items-center text-left w-full truncate md:cursor-auto"
                                    onClick={() => toggleProjectExpand(project.id)}
                                    {...(expandedProjectIds.includes(project.id)
                                      ? { 'aria-expanded': true, 'aria-controls': `p-details-${project.id}` }
                                      : { 'aria-expanded': false })}
                                  >
                                    <span className="block truncate">{project.name}</span>
                                    <span
                                      className={`ml-2 inline-block md:hidden transform transition-transform duration-150 ${expandedProjectIds.includes(project.id) ? 'rotate-180' : ''}`}
                                      aria-hidden
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openProjectDialog(project)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteProjectConfirm(project.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedProjectIds.includes(project.id) && (
                            <TableRow id={`p-details-${project.id}`}>
                              <TableCell className="md:hidden" colSpan={2} role="region">
                                <div className="space-y-2">
                                  <div className="text-sm"><strong>{t('workersProjects.projectNameLabel')}:</strong> {project.name}</div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Worker Dialog */}
      <Dialog open={isWorkerDialogOpen} onOpenChange={setIsWorkerDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? t('workersProjects.editWorker') : t('workersProjects.addWorkerTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingWorker ? t('workersProjects.editWorkerDesc') : t('workersProjects.addWorkerDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('workersProjects.workerName')}</Label>
              <Input
                value={workerFormData.name}
                onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                placeholder={t('workersProjects.workerNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('workersProjects.employeeId')}</Label>
              <Input
                value={workerFormData.employeeId}
                onChange={(e) => setWorkerFormData({ ...workerFormData, employeeId: e.target.value })}
                placeholder={t('workersProjects.employeeIdPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkerDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleWorkerSubmit}>
              {editingWorker ? t('workersProjects.updateWorker') : t('workersProjects.addWorkerBtn')} {t('workersProjects.workers')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? t('workersProjects.editProjectTitle') : t('workersProjects.addProjectTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? t('workersProjects.editProjectDesc') : t('workersProjects.addProjectDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('workersProjects.projectName')}</Label>
              <Input
                value={projectFormData.name}
                onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                placeholder={t('workersProjects.projectNamePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleProjectSubmit}>
              {editingProject ? t('workersProjects.updateProject') : t('workersProjects.addProjectBtn')} {t('workersProjects.projects')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Worker Confirmation */}
      <AlertDialog open={deleteWorkerConfirm !== null} onOpenChange={() => setDeleteWorkerConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workersProjects.deleteWorkerTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workersProjects.deleteWorkerDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteWorkerConfirm && handleWorkerDelete(deleteWorkerConfirm)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={deleteProjectConfirm !== null} onOpenChange={() => setDeleteProjectConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workersProjects.deleteProjectTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('workersProjects.deleteProjectDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteProjectConfirm && handleProjectDelete(deleteProjectConfirm)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
