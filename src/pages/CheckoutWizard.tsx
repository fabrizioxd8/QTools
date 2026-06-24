import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Search, User, Folder, Wrench } from 'lucide-react';
import { matchesSearch } from '@/lib/search';
import { useSidebar } from '@/components/ui/sidebar';
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
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface CheckoutWizardProps {
  onNavigate?: (page: string) => void;
}

export default function CheckoutWizard({ onNavigate }: CheckoutWizardProps = {}) {
  const { tools, workers, projects, createAssignment, isLoading } = useAppData();
  const { state, isMobile } = useSidebar();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [toolSearch, setToolSearch] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [guiaNumber, setGuiaNumber] = useState('');

  const [checkoutTime, setCheckoutTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });

  const toolSearchInputRef = useRef<HTMLInputElement>(null);
  const workerSearchInputRef = useRef<HTMLInputElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);

  const [checkoutDate, setCheckoutDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const availableTools = tools.filter(t => (t.availableQuantity ?? 0) > 0);

  const selectedToolTypes = selectedTools.length;
  const selectedItemCount = selectedTools.reduce((sum, tool) => sum + (tool.quantity || 1), 0);

  const filteredTools = availableTools.filter(t => matchesSearch(t.name, toolSearch));
  const filteredWorkers = workers.filter(w => matchesSearch(w.name, workerSearch) || matchesSearch(w.employeeId, workerSearch));
  const filteredProjects = projects.filter(p => matchesSearch(p.name, projectSearch));

  const steps = [
    { number: 1, title: t('checkout.step1'), icon: CheckCircle },
    { number: 2, title: t('checkout.step2'), icon: User },
    { number: 3, title: t('checkout.step3'), icon: Folder },
    { number: 4, title: t('checkout.step4'), icon: CheckCircle },
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

  const handleNext = () => { if (canProceed() && currentStep < 4) setCurrentStep(currentStep + 1); };
  const handlePrevious = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const toggleToolSelection = (tool: Tool) => {
    setSelectedTools(prev => {
      const exists = prev.find(t => t.id === tool.id);
      if (exists) return prev.filter(t => t.id !== tool.id);
      return [...prev, { ...tool, quantity: 1 }];
    });
  };

  const updateSelectedToolQuantity = (toolId: number, qty: number) => {
    setSelectedTools(prev => prev.map(t => t.id === toolId ? { ...t, quantity: qty } : t));
  };

  const handleComplete = async () => {
    if (selectedWorker && selectedProject && selectedTools.length > 0) {
      try {
        const [year, month, day] = checkoutDate.split('-').map(Number);
        const [hour, minute, second] = checkoutTime.split(':').map(Number);
        const checkoutDateObj = new Date(year, month - 1, day, hour ?? 0, minute ?? 0, second ?? 0);

        await createAssignment({
          checkoutDate: checkoutDateObj.toISOString(),
          checkoutNotes: checkoutNotes.trim() || undefined,
          worker: selectedWorker,
          project: selectedProject,
          tools: selectedTools,
          guiaNumber: guiaNumber.trim() || undefined,
        });

        toast.success(t('checkout.checkoutSuccess'));

        setCurrentStep(1);
        setSelectedTools([]);
        setSelectedWorker(null);
        setSelectedProject(null);
        setCheckoutNotes('');
        onNavigate?.('assignments');
      } catch (error) {
        toast.error(t('checkout.checkoutFailed'));
        console.error('Error creating assignment:', error);
      }
    }
  };

  const progressPercentage = (currentStep / 4) * 100;
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowLoading(false), 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        if (currentStep === 1) toolSearchInputRef.current?.focus();
        else if (currentStep === 2) workerSearchInputRef.current?.focus();
        else if (currentStep === 3) projectSearchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('checkout.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">{t('checkout.title')}</h1>
        <p className="text-muted-foreground">{t('checkout.subtitle')}</p>
      </div>

      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-px bg-border translate-y-1/2" />
                <div className="grid grid-cols-4 items-center gap-4">
                  {steps.map(step => (
                    <div key={step.number} className="relative flex flex-col items-center text-center">
                      <div
                        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.number
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border'
                          }`}
                      >
                        <step.icon className="h-5 w-5" />
                      </div>
                      <span className={`mt-2 text-xs md:text-sm ${currentStep >= step.number ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Progress value={progressPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Step 1 — Tools */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.selectToolsTitle')}</CardTitle>
            <CardDescription>{t('checkout.selectToolsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={toolSearchInputRef}
                  placeholder={t('checkout.searchTools')}
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {filteredTools.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('checkout.noToolsAvailable')}</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTools.map(tool => {
                    const isSelected = selectedTools.some(t => t.id === tool.id);
                    return (
                      <Card
                        key={tool.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => toggleToolSelection(tool)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <CardTitle className="text-base">{tool.name}</CardTitle>
                              <Badge variant="outline">{tool.category}</Badge>
                              <div className="text-xs text-muted-foreground pt-1 space-x-2">
                                {Object.entries(tool.customAttributes).map(([key, value]) => (
                                  <Badge key={key} variant="secondary">{key}: {value}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox checked={isSelected} />
                              {isSelected && (tool.quantity || 1) > 1 && (
                                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    aria-label={`Decrease quantity for ${tool.name}`}
                                    className="h-8 w-8 rounded border flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = selectedTools.find(t => t.id === tool.id)?.quantity || 1;
                                      updateSelectedToolQuantity(tool.id, Math.max(1, current - 1));
                                    }}
                                  >-</button>
                                  <div className="w-12 text-center">{selectedTools.find(t => t.id === tool.id)?.quantity || 1}</div>
                                  <button
                                    aria-label={`Increase quantity for ${tool.name}`}
                                    className="h-8 w-8 rounded border flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const current = selectedTools.find(t => t.id === tool.id)?.quantity || 1;
                                      updateSelectedToolQuantity(tool.id, Math.min(tool.availableQuantity || 0, current + 1));
                                    }}
                                  >+</button>
                                </div>
                              )}
                            </div>
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

      {/* Step 2 — Worker */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.selectWorkerTitle')}</CardTitle>
            <CardDescription>{t('checkout.selectWorkerDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={workerSearchInputRef}
                  placeholder={t('checkout.searchWorkers')}
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              {filteredWorkers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('checkout.noWorkersFound')}</p>
              ) : (
                <RadioGroup
                  value={selectedWorker?.id.toString()}
                  onValueChange={(value) => setSelectedWorker(workers.find(w => w.id.toString() === value) || null)}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredWorkers.map(worker => (
                      <Card
                        key={worker.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedWorker?.id === worker.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedWorker(worker)}
                      >
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={worker.id.toString()} id={`worker-${worker.id}`} />
                            <div className="flex items-center space-x-3 flex-1">
                              <User className="h-10 w-10 text-muted-foreground" />
                              <div>
                                <Label htmlFor={`worker-${worker.id}`} className="cursor-pointer font-semibold">{worker.name}</Label>
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

      {/* Step 3 — Project */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.selectProjectTitle')}</CardTitle>
            <CardDescription>{t('checkout.selectProjectDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={projectSearchInputRef}
                  placeholder={t('checkout.searchProjects')}
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              {filteredProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('checkout.noProjectsFound')}</p>
              ) : (
                <RadioGroup
                  value={selectedProject?.id.toString()}
                  onValueChange={(value) => setSelectedProject(projects.find(p => p.id.toString() === value) || null)}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredProjects.map(project => (
                      <Card
                        key={project.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedProject?.id === project.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={project.id.toString()} id={`project-${project.id}`} />
                            <div className="flex items-center space-x-3 flex-1">
                              <Folder className="h-10 w-10 text-muted-foreground" />
                              <Label htmlFor={`project-${project.id}`} className="cursor-pointer font-semibold">{project.name}</Label>
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

      {/* Step 4 — Review */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('checkout.reviewTitle')}</CardTitle>
            <CardDescription>{t('checkout.reviewDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">
                  {t('checkout.selectedTools')} ({selectedToolTypes} {t('checkout.toolsSelected')} — {selectedItemCount} {t('checkout.itemsSelected')})
                </h3>
                <div className="space-y-2">
                  {selectedTools.map(tool => (
                    <div key={tool.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-sm text-muted-foreground">{tool.category}</p>
                          <div className="text-xs text-muted-foreground mt-1 space-x-2">
                            {Object.entries(tool.customAttributes).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">{key}: {value}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>{t('checkout.qty')}: {tool.quantity || 1}</div>
                          <div>{t('checkout.available')}: {tools.find(t => t.id === tool.id)?.availableQuantity ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedWorker && (
                <div>
                  <h3 className="font-semibold mb-2">{t('checkout.assignedWorker')}</h3>
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
                  <h3 className="font-semibold mb-2">{t('checkout.project')}</h3>
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
                <h3 className="font-semibold mb-2">{t('checkout.checkoutDate')}</h3>
                <div className="flex items-center">
                  <Input
                    type="date"
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="w-auto h-11 max-w-[200px]"
                  />
                  <div className="ml-4">
                    <Label className="sr-only" htmlFor="checkout-time">{t('checkout.checkoutTime')}</Label>
                    <Input
                      id="checkout-time"
                      type="time"
                      step="1"
                      value={checkoutTime}
                      onChange={(e) => setCheckoutTime(e.target.value)}
                      className="w-auto h-11 max-w-[140px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('checkout.guideNumber')}</h3>
                <Input
                  placeholder={t('checkout.guideNumberPlaceholder')}
                  value={guiaNumber}
                  onChange={(e) => setGuiaNumber(e.target.value)}
                  className="w-full max-w-md"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('checkout.notesOptional')}</h3>
                <Textarea
                  placeholder={t('checkout.notesPlaceholder')}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{t('checkout.notesHint')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <div className="px-4 pb-4">
          <div className="text-sm text-muted-foreground">
            {selectedToolTypes} {t('checkout.toolsSelected')} — {selectedItemCount} {t('checkout.itemsSelected')}
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <div
        className={`fixed bottom-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 transition-all duration-200 ease-in-out shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] ${isMobile ? 'left-0' : state === 'collapsed' ? 'left-12' : 'left-64'
          }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-2">
          {currentStep === 1 && selectedToolTypes > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-5 w-5 text-primary" />
              <span className="font-bold">{selectedToolTypes} {t('checkout.toolsSelected')}</span>
              <span>— {selectedItemCount} {t('checkout.itemsSelected')}</span>
            </div>
          )}
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('checkout.previous')}
            </Button>
          )}
          <div className="flex-grow" />
          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              {t('checkout.next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={!canProceed()}>
              {t('checkout.completeCheckout')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
