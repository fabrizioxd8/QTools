import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || `https://${window.location.hostname}:3000/api`;
// Interfaces remain the same
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
export interface Worker { id: number; name: string; employeeId: string; }
export interface Project { id: number; name: string; }
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

    // --- CRUD Functions ---
    const addTool = async (tool: Omit<Tool, 'id'>) => apiRequest(`${API_URL}/tools`, 'POST', tool);
    const updateTool = async (id: number, tool: Partial<Tool>) => apiRequest(`${API_URL}/tools/${id}`, 'PUT', tool);
    const deleteTool = async (id: number) => apiRequest(`${API_URL}/tools/${id}`, 'DELETE');

    const addWorker = async (worker: Omit<Worker, 'id'>) => apiRequest(`${API_URL}/workers`, 'POST', worker);
    const updateWorker = async (id: number, worker: Partial<Worker>) => apiRequest(`${API_URL}/workers/${id}`, 'PUT', worker);
    const deleteWorker = async (id: number) => apiRequest(`${API_URL}/workers/${id}`, 'DELETE');

    const addProject = async (project: Omit<Project, 'id'>) => apiRequest(`${API_URL}/projects`, 'POST', project);
    const updateProject = async (id: number, project: Partial<Project>) => apiRequest(`${API_URL}/projects/${id}`, 'PUT', project);
    const deleteProject = async (id: number) => apiRequest(`${API_URL}/projects/${id}`, 'DELETE');

    const createAssignment = async (assignment: Omit<Assignment, 'id' | 'status' | 'worker' | 'project'> & { workerId: number, projectId: number }) => {
        await apiRequest(`${API_URL}/assignments`, 'POST', assignment);
    };

    const checkInAssignment = async (id: number, checkinNotes?: string, toolConditions?: Record<number, 'good' | 'damaged' | 'lost'>) => {
        await apiRequest(`${API_URL}/assignments/${id}/checkin`, 'PUT', { checkinNotes, toolConditions });
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
