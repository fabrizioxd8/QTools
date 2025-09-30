import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// A custom hook to manage state with localStorage
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null
        ? JSON.parse(stickyValue)
        : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}


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
  const [tools, setTools] = useStickyState<Tool[]>(initialTools, 'qtools_tools');
  const [workers, setWorkers] = useStickyState<Worker[]>(initialWorkers, 'qtools_workers');
  const [projects, setProjects] = useStickyState<Project[]>(initialProjects, 'qtools_projects');
  const [assignments, setAssignments] = useStickyState<Assignment[]>(initialAssignments, 'qtools_assignments');

  const addTool = (tool: Omit<Tool, 'id'>) => {
    const newTool = { ...tool, id: Math.max(0, ...tools.map(t => t.id)) + 1 };
    setTools([...tools, newTool]);
  };

  const updateTool = (id: number, updatedTool: Partial<Tool>) => {
    setTools(prevTools => prevTools.map(tool => tool.id === id ? { ...tool, ...updatedTool } : tool));
    // Update tools in active assignments
    setAssignments(prevAssignments => prevAssignments.map(assignment => ({
      ...assignment,
      tools: assignment.tools.map(tool => 
        tool.id === id ? { ...tool, ...updatedTool } : tool
      )
    })));
  };

  const deleteTool = (id: number) => {
    setTools(prevTools => prevTools.filter(tool => tool.id !== id));
  };

  const addWorker = (worker: Omit<Worker, 'id'>) => {
    const newWorker = { ...worker, id: Math.max(0, ...workers.map(w => w.id)) + 1 };
    setWorkers([...workers, newWorker]);
  };

  const updateWorker = (id: number, updatedWorker: Partial<Worker>) => {
    setWorkers(prevWorkers => prevWorkers.map(worker => worker.id === id ? { ...worker, ...updatedWorker } : worker));
  };

  const deleteWorker = (id: number) => {
    setWorkers(prevWorkers => prevWorkers.filter(worker => worker.id !== id));
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: Math.max(0, ...projects.map(p => p.id)) + 1 };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: number, updatedProject: Partial<Project>) => {
    setProjects(prevProjects => prevProjects.map(project => project.id === id ? { ...project, ...updatedProject } : project));
  };

  const deleteProject = (id: number) => {
    setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
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
    // This needs to be a functional update to get the latest tools state
    setAssignments(prevAssignments => {
      const newAssignments = [...prevAssignments];
      const assignmentIndex = newAssignments.findIndex(a => a.id === id);

      if (assignmentIndex > -1) {
        const assignment = newAssignments[assignmentIndex];

        // This is tricky because updateTool relies on the old state.
        // A better approach would be to handle this in a more transactional way,
        // but for now, we'll update the tools directly.
        let toolsToUpdate = [...tools];
        assignment.tools.forEach(tool => {
          const condition = toolConditions?.[tool.id];
          let newStatus: Tool['status'] = 'Available';
          if (condition === 'damaged') newStatus = 'Damaged';
          else if (condition === 'lost') newStatus = 'Lost';
          
          toolsToUpdate = toolsToUpdate.map(t => t.id === tool.id ? { ...t, status: newStatus } : t);
        });
        setTools(toolsToUpdate);

        newAssignments[assignmentIndex] = {
          ...assignment,
          checkinDate: new Date().toISOString(),
          status: 'completed' as const,
          checkinNotes,
          toolConditions
        };
      }
      return newAssignments;
    });
  };

  return (
    <AppDataContext.Provider
      value={{
        tools,
        workers,
        projects,
        assignments,
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
