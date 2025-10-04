import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Tool {
  id: number;
  name: string;
  category: string;
  status: 'Available' | 'In Use' | 'Damaged' | 'Lost' | 'Cal. Due';
  isCalibrable: boolean;
  calibrationDue?: string;
  image?: string;
  customAttributes: Record<string, string>;
}

export interface Worker {
  id: number;
  name: string;
  employeeId: string;
}

export interface Project {
  id: number;
  name: string;
}

export interface Assignment {
  id: number;
  checkoutDate: string;
  worker: Worker;
  project: Project;
  tools: Tool[];
  checkinDate?: string;
  status: 'active' | 'completed';
  checkinNotes?: string;
  toolConditions?: Record<number, 'good' | 'damaged' | 'lost'>;
}

interface AppDataContextType {
  tools: Tool[];
  workers: Worker[];
  projects: Project[];
  assignments: Assignment[];
  isLoading: boolean;
  addTool: (tool: Omit<Tool, 'id'>) => void;
  updateTool: (id: number, tool: Partial<Tool>) => void;
  deleteTool: (id: number) => void;
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (id: number, worker: Partial<Worker>) => void;
  deleteWorker: (id: number) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: number, project: Partial<Project>) => void;
  deleteProject: (id: number) => void;
  createAssignment: (assignment: Omit<Assignment, 'id' | 'status'>) => void;
  checkInAssignment: (id: number, checkinNotes?: string, toolConditions?: Record<number, 'good' | 'damaged' | 'lost'>) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Mock initial data
const initialTools: Tool[] = [
  {
    id: 1,
    name: 'Digital Multimeter',
    category: 'Electrical',
    status: 'Available',
    isCalibrable: true,
    calibrationDue: '2025-12-31',
    image: '/placeholder.svg',
    customAttributes: { brand: 'Fluke', model: '87V' }
  },
  {
    id: 2,
    name: 'Torque Wrench',
    category: 'Mechanical',
    status: 'Available',
    isCalibrable: true,
    calibrationDue: '2025-11-15',
    customAttributes: { range: '10-150 Nm' }
  },
  {
    id: 3,
    name: 'Safety Harness',
    category: 'Safety',
    status: 'In Use',
    isCalibrable: false,
    customAttributes: { size: 'Large', certified: 'Yes' }
  },
  {
    id: 4,
    name: 'Oscilloscope',
    category: 'Electrical',
    status: 'Available',
    isCalibrable: true,
    calibrationDue: '2025-10-20',
    customAttributes: { bandwidth: '100MHz' }
  },
  {
    id: 5,
    name: 'Impact Driver',
    category: 'Mechanical',
    status: 'Damaged',
    isCalibrable: false,
    customAttributes: { voltage: '18V' }
  },
];

const initialWorkers: Worker[] = [
  { id: 1, name: 'John Smith', employeeId: 'EMP001' },
  { id: 2, name: 'Sarah Johnson', employeeId: 'EMP002' },
  { id: 3, name: 'Michael Brown', employeeId: 'EMP003' },
  { id: 4, name: 'Emily Davis', employeeId: 'EMP004' },
];

const initialProjects: Project[] = [
  { id: 1, name: 'Building A Renovation' },
  { id: 2, name: 'Lab Equipment Installation' },
  { id: 3, name: 'Power Grid Maintenance' },
  { id: 4, name: 'Safety Audit 2025' },
];

const initialAssignments: Assignment[] = [
  {
    id: 1,
    checkoutDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    worker: initialWorkers[0],
    project: initialProjects[0],
    tools: [initialTools[2]],
    status: 'active'
  },
];

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const addTool = (tool: Omit<Tool, 'id'>) => {
    const newTool = { ...tool, id: Math.max(0, ...tools.map(t => t.id)) + 1 };
    setTools([...tools, newTool]);
  };

  const updateTool = (id: number, updatedTool: Partial<Tool>) => {
    setTools(tools.map(tool => tool.id === id ? { ...tool, ...updatedTool } : tool));
    // Update tools in active assignments
    setAssignments(assignments.map(assignment => ({
      ...assignment,
      tools: assignment.tools.map(tool => 
        tool.id === id ? { ...tool, ...updatedTool } : tool
      )
    })));
  };

  const deleteTool = (id: number) => {
    setTools(tools.filter(tool => tool.id !== id));
  };

  const addWorker = (worker: Omit<Worker, 'id'>) => {
    const newWorker = { ...worker, id: Math.max(0, ...workers.map(w => w.id)) + 1 };
    setWorkers([...workers, newWorker]);
  };

  const updateWorker = (id: number, updatedWorker: Partial<Worker>) => {
    setWorkers(workers.map(worker => worker.id === id ? { ...worker, ...updatedWorker } : worker));
  };

  const deleteWorker = (id: number) => {
    setWorkers(workers.filter(worker => worker.id !== id));
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: Math.max(0, ...projects.map(p => p.id)) + 1 };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: number, updatedProject: Partial<Project>) => {
    setProjects(projects.map(project => project.id === id ? { ...project, ...updatedProject } : project));
  };

  const deleteProject = (id: number) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  const createAssignment = (assignment: Omit<Assignment, 'id' | 'status'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: Math.max(0, ...assignments.map(a => a.id)) + 1,
      status: 'active'
    };
    setAssignments([...assignments, newAssignment]);

    // Update tool statuses to "In Use"
    assignment.tools.forEach(tool => {
      updateTool(tool.id, { status: 'In Use' });
    });
  };

  const checkInAssignment = (
    id: number,
    checkinNotes?: string,
    toolConditions?: Record<number, 'good' | 'damaged' | 'lost'>
  ) => {
    setAssignments(assignments.map(assignment => {
      if (assignment.id === id) {
        // Update tool statuses based on conditions
        assignment.tools.forEach(tool => {
          const condition = toolConditions?.[tool.id];
          let newStatus: Tool['status'] = 'Available';
          if (condition === 'damaged') newStatus = 'Damaged';
          else if (condition === 'lost') newStatus = 'Lost';
          else if (condition === 'good') newStatus = 'Available';

          updateTool(tool.id, { status: newStatus });
        });

        return {
          ...assignment,
          checkinDate: new Date().toISOString(),
          status: 'completed' as const,
          checkinNotes,
          toolConditions
        };
      }
      return assignment;
    }));
  };

  return (
    <AppDataContext.Provider
      value={{
        tools,
        workers,
        projects,
        assignments,
        isLoading,
        addTool,
        updateTool,
        deleteTool,
        addWorker,
        updateWorker,
        deleteWorker,
        addProject,
        updateProject,
        deleteProject,
        createAssignment,
        checkInAssignment,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
