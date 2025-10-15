import { useState, useMemo } from 'react';
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

export default function WorkersProjects() {
  const { workers, projects, assignments, addWorker, updateWorker, deleteWorker, addProject, updateProject, deleteProject } = useAppData();
  const [expandedWorkerIds, setExpandedWorkerIds] = useState<number[]>([]);
  const [expandedProjectIds, setExpandedProjectIds] = useState<number[]>([]);
  const toggleWorkerExpand = (id: number) => {
    setExpandedWorkerIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleProjectExpand = (id: number) => {
    setExpandedProjectIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  
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
      if (workerSortDirection === 'asc') {
        setWorkerSortDirection('desc');
      } else {
        // Reset to unsorted
        setWorkerSortField(null);
        setWorkerSortDirection('asc');
      }
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
      if (projectSortDirection === 'asc') {
        setProjectSortDirection('desc');
      } else {
        // Reset to unsorted
        setProjectSortField(null);
        setProjectSortDirection('asc');
      }
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
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingWorker) {
        await updateWorker(editingWorker.id, workerFormData);
        toast.success('Worker updated successfully');
      } else {
        await addWorker(workerFormData);
        toast.success('Worker added successfully');
      }
      
      setIsWorkerDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save worker. Please try again.');
      console.error('Error saving worker:', error);
    }
  };

  const handleWorkerDelete = async (id: number) => {
    try {
      await deleteWorker(id);
      toast.success('Worker deleted successfully');
      setDeleteWorkerConfirm(null);
    } catch (error) {
      toast.error('Failed to delete worker. Please try again.');
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
      toast.error('Please enter a project name');
      return;
    }

    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectFormData);
        toast.success('Project updated successfully');
      } else {
        await addProject(projectFormData);
        toast.success('Project added successfully');
      }
      
      setIsProjectDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save project. Please try again.');
      console.error('Error saving project:', error);
    }
  };

  const handleProjectDelete = async (id: number) => {
    try {
      await deleteProject(id);
      toast.success('Project deleted successfully');
      setDeleteProjectConfirm(null);
    } catch (error) {
      toast.error('Failed to delete project. Please try again.');
      console.error('Error deleting project:', error);
    }
  };

  const workerStats = useMemo(() => {
    const stats = new Map<number, { projectCount: number; toolCount: number }>();
    const projectSet = new Map<number, Set<number>>();

    assignments.forEach(assignment => {
      if (assignment.status === 'active') {
        const workerId = assignment.worker.id;

        if (!projectSet.has(workerId)) {
          projectSet.set(workerId, new Set());
        }
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
      w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.employeeId.toLowerCase().includes(workerSearch.toLowerCase())
    );
  }, [workers, workerSearch, workerSortField, workerSortDirection, workerStats]);



  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workers & Projects</h1>
        <p className="text-muted-foreground">Manage workers and projects</p>
      </div>

      <Tabs defaultValue="workers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Workers</CardTitle>
                <Button onClick={() => openWorkerDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workers..."
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                

              </div>
              
              {sortedAndFilteredWorkers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No workers found</p>
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
                          Name
                          {(() => {
                            const Icon = getWorkerSortIcon('name');
                            return <Icon className="ml-2 h-4 w-4" />;
                          })()}
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Employee ID</TableHead>
                      <TableHead className="hidden md:table-cell">Assigned Projects</TableHead>
                      <TableHead className="hidden md:table-cell">Assigned Tools</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                                  aria-expanded={expandedWorkerIds.includes(worker.id)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openWorkerDialog(worker)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteWorkerConfirm(worker.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                        </TableRow>
                        {/* Expandable details row for small screens */}
                        {expandedWorkerIds.includes(worker.id) ? (
                          <TableRow key={`details-${worker.id}`}>
                            <TableCell className="md:hidden" colSpan={5}>
                              <div className="space-y-2">
                                <div className="text-sm"><strong>Employee ID:</strong> {worker.employeeId}</div>
                                <div className="text-sm"><strong>Assigned Projects:</strong> {worker.projectCount}</div>
                                <div className="text-sm"><strong>Assigned Tools:</strong> {worker.toolCount}</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
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
                <CardTitle>Projects</CardTitle>
                <Button onClick={() => openProjectDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              {filteredProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects found</p>
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
                          Project Name
                          {(() => {
                            const Icon = getProjectSortIcon('name');
                            return <Icon className="ml-2 h-4 w-4" />;
                          })()}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                                aria-expanded={expandedProjectIds.includes(project.id)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openProjectDialog(project)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteProjectConfirm(project.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                        </TableRow>
                        {expandedProjectIds.includes(project.id) ? (
                          <TableRow key={`p-details-${project.id}`}>
                            <TableCell className="md:hidden" colSpan={2}>
                              <div className="space-y-2">
                                <div className="text-sm"><strong>Project Name:</strong> {project.name}</div>
                                {/* add more project details here if needed */}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
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
            <DialogTitle>{editingWorker ? 'Edit Worker' : 'Add New Worker'}</DialogTitle>
            <DialogDescription>
              {editingWorker ? 'Update worker information' : 'Add a new worker to your system'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Worker Name *</Label>
              <Input
                value={workerFormData.name}
                onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                placeholder="Enter worker name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Employee ID *</Label>
              <Input
                value={workerFormData.employeeId}
                onChange={(e) => setWorkerFormData({ ...workerFormData, employeeId: e.target.value })}
                placeholder="Enter employee ID"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkerDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleWorkerSubmit}>
              {editingWorker ? 'Update' : 'Add'} Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
            <DialogDescription>
              {editingProject ? 'Update project information' : 'Add a new project to your system'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                value={projectFormData.name}
                onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleProjectSubmit}>
              {editingProject ? 'Update' : 'Add'} Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Worker Confirmation */}
      <AlertDialog open={deleteWorkerConfirm !== null} onOpenChange={() => setDeleteWorkerConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this worker from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteWorkerConfirm && handleWorkerDelete(deleteWorkerConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={deleteProjectConfirm !== null} onOpenChange={() => setDeleteProjectConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteProjectConfirm && handleProjectDelete(deleteProjectConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
