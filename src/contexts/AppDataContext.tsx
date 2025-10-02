import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:3000/api';

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
  addTool: (tool: Omit<Tool, 'id'>) => Promise<void>;
  updateTool: (id: number, tool: Partial<Tool>) => Promise<void>;
  deleteTool: (id: number) => Promise<void>;
  addWorker: (worker: Omit<Worker, 'id'>) => Promise<void>;
  updateWorker: (id: number, worker: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: number) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: number, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  createAssignment: (assignment: Omit<Assignment, 'id' | 'status' | 'worker' | 'project'> & { workerId: number, projectId: number }) => Promise<void>;
  checkInAssignment: (id: number, checkinNotes?: string, toolConditions?: Record<number, 'good' | 'damaged' | 'lost'>) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tools, setTools] = useState<Tool[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/data`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            // Parse customAttributes from JSON string
            const parsedTools = data.tools.map((tool: any) => ({
                ...tool,
                customAttributes: typeof tool.customAttributes === 'string' ? JSON.parse(tool.customAttributes) : tool.customAttributes || {}
            }));

            setTools(parsedTools);
            setWorkers(data.workers);
            setProjects(data.projects);
            setAssignments(data.assignments);
        } catch (error) {
            toast.error("Failed to connect to the local server. Is it running?");
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const apiRequest = async (url: string, method: string, body?: any) => {
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) throw new Error('API request failed');
            await fetchData(); // Refetch all data to stay in sync
        } catch (error) {
            toast.error(`API Error: ${error.message}`);
            console.error("API Error:", error);
        }
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
