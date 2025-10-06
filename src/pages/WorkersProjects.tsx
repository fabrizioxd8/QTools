import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Folder, Wrench } from 'lucide-react';
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
  
  // Worker state
  const [isWorkerDialogOpen, setIsWorkerDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerFormData, setWorkerFormData] = useState({ name: '', employeeId: '' });
  const [workerSearch, setWorkerSearch] = useState('');
  const [deleteWorkerConfirm, setDeleteWorkerConfirm] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
  
  // Project state
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({ name: '' });
  const [projectSearch, setProjectSearch] = useState('');
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState<number | null>(null);

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
    let sortableWorkers = workers.map(w => ({
      ...w,
      ...(workerStats.get(w.id) || { projectCount: 0, toolCount: 0 })
    }));

    if (sortConfig !== null) {
      sortableWorkers.sort((a, b) => {
        const key = sortConfig.key as keyof typeof a;
        if (a[key] < b[key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableWorkers.filter(w =>
      w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.employeeId.toLowerCase().includes(workerSearch.toLowerCase())
    );
  }, [workers, workerSearch, sortConfig, workerStats]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

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
              <div className="mb-4">
                <div className="relative">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
                        <div className="flex items-center">Name <ArrowUpDown className="ml-2 h-4 w-4" /></div>
                      </TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort('projectCount')}>
                        <div className="flex items-center">Assigned Projects <ArrowUpDown className="ml-2 h-4 w-4" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort('toolCount')}>
                        <div className="flex items-center">Assigned Tools <ArrowUpDown className="ml-2 h-4 w-4" /></div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredWorkers.map(worker => (
                      <TableRow key={worker.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{worker.name}</TableCell>
                        <TableCell>{worker.employeeId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-muted-foreground" /> {worker.projectCount}
                          </div>
                        </TableCell>
                        <TableCell>
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
                    ))}
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map(project => (
                      <TableRow key={project.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{project.name}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
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
