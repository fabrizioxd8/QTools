import { useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Search, User, Folder } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppData, Tool, Worker, Project } from '@/contexts/AppDataContext';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CheckoutWizardProps {
  onNavigate: (page: string) => void;
}

export default function CheckoutWizard({ onNavigate }: CheckoutWizardProps) {
  const { tools, workers, projects, createAssignment } = useAppData();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [toolSearch, setToolSearch] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const availableTools = tools.filter(t => t.status === 'Available');
  const filteredTools = availableTools.filter(t => 
    t.name.toLowerCase().includes(toolSearch.toLowerCase())
  );
  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.employeeId.toLowerCase().includes(workerSearch.toLowerCase())
  );
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const steps = [
    { number: 1, title: 'Select Tools', icon: CheckCircle },
    { number: 2, title: 'Select Worker', icon: User },
    { number: 3, title: 'Select Project', icon: Folder },
    { number: 4, title: 'Review & Confirm', icon: CheckCircle },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedTools.length > 0;
      case 2: return selectedWorker !== null;
      case 3: return selectedProject !== null;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleToolSelection = (tool: Tool) => {
    setSelectedTools(prev => {
      const exists = prev.find(t => t.id === tool.id);
      if (exists) {
        return prev.filter(t => t.id !== tool.id);
      } else {
        return [...prev, tool];
      }
    });
  };

  const handleComplete = () => {
    if (selectedWorker && selectedProject && selectedTools.length > 0) {
      createAssignment({
        checkoutDate: new Date().toISOString(),
        worker: selectedWorker,
        project: selectedProject,
        tools: selectedTools,
      });
      
      toast.success('Checkout completed successfully!');
      
      // Reset wizard
      setCurrentStep(1);
      setSelectedTools([]);
      setSelectedWorker(null);
      setSelectedProject(null);
      
      // Navigate to assignments
      onNavigate('assignments');
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Checkout Wizard</h1>
        <p className="text-muted-foreground">Follow the steps to checkout tools</p>
      </div>

      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep >= step.number
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border'
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-12 md:w-24 mx-2 ${
                        currentStep > step.number ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              {steps.map(step => (
                <span
                  key={step.number}
                  className={`${
                    currentStep >= step.number ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
            <Progress value={progressPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Tools</CardTitle>
            <CardDescription>Choose tools to checkout (only available tools shown)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {selectedTools.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Selected: {selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              
              {filteredTools.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No available tools found</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTools.map(tool => {
                    const isSelected = selectedTools.some(t => t.id === tool.id);
                    return (
                      <Card
                        key={tool.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => toggleToolSelection(tool)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{tool.name}</CardTitle>
                              <Badge variant="outline" className="mt-1">{tool.category}</Badge>
                            </div>
                            <Checkbox checked={isSelected} />
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Worker</CardTitle>
            <CardDescription>Choose the worker who will receive the tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {filteredWorkers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No workers found</p>
              ) : (
                <RadioGroup
                  value={selectedWorker?.id.toString()}
                  onValueChange={(value) => {
                    const worker = workers.find(w => w.id.toString() === value);
                    setSelectedWorker(worker || null);
                  }}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredWorkers.map(worker => (
                      <Card
                        key={worker.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedWorker?.id === worker.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedWorker(worker)}
                      >
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={worker.id.toString()} id={`worker-${worker.id}`} />
                            <div className="flex items-center space-x-3 flex-1">
                              <User className="h-10 w-10 text-muted-foreground" />
                              <div>
                                <Label htmlFor={`worker-${worker.id}`} className="cursor-pointer font-semibold">
                                  {worker.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">{worker.employeeId}</p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
            <CardDescription>Choose the project for this checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {filteredProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects found</p>
              ) : (
                <RadioGroup
                  value={selectedProject?.id.toString()}
                  onValueChange={(value) => {
                    const project = projects.find(p => p.id.toString() === value);
                    setSelectedProject(project || null);
                  }}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredProjects.map(project => (
                      <Card
                        key={project.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={project.id.toString()} id={`project-${project.id}`} />
                            <div className="flex items-center space-x-3 flex-1">
                              <Folder className="h-10 w-10 text-muted-foreground" />
                              <Label htmlFor={`project-${project.id}`} className="cursor-pointer font-semibold">
                                {project.name}
                              </Label>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Please review your checkout details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Selected Tools ({selectedTools.length})</h3>
                <div className="space-y-2">
                  {selectedTools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{tool.name}</p>
                        <p className="text-sm text-muted-foreground">{tool.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedWorker && (
                <div>
                  <h3 className="font-semibold mb-2">Assigned Worker</h3>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <User className="h-10 w-10 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{selectedWorker.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedWorker.employeeId}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              )}
              
              {selectedProject && (
                <div>
                  <h3 className="font-semibold mb-2">Project</h3>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Folder className="h-10 w-10 text-muted-foreground" />
                        <p className="font-semibold">{selectedProject.name}</p>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Checkout Date</h3>
                <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!canProceed()}>
            Complete Checkout
          </Button>
        )}
      </div>
    </div>
  );
}
