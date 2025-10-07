import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiClient } from '@/lib/api';

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

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load all data in parallel
        const [toolsData, workersData, projectsData, assignmentsData] = await Promise.all([
          apiClient.getTools(),
          apiClient.getWorkers(),
          apiClient.getProjects(),
          apiClient.getAssignments(),
        ]);

        setTools(toolsData);
        setWorkers(workersData);
        setProjects(projectsData);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Set empty arrays so the app doesn't stay in loading state
        setTools([]);
        setWorkers([]);
        setProjects([]);
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addTool = async (tool: Omit<Tool, 'id'>) => {
    try {
      const newTool = await apiClient.createTool(tool);
      setTools([...tools, newTool]);
    } catch (error) {
      console.error('Failed to add tool:', error);
      throw error;
    }
  };

  const updateTool = async (id: number, updatedTool: Partial<Tool>) => {
    try {
      const updated = await apiClient.updateTool(id, updatedTool);
      setTools(tools.map(tool => tool.id === id ? updated : tool));

      // Update tools in active assignments
      setAssignments(assignments.map(assignment => ({
        ...assignment,
        tools: assignment.tools.map(tool =>
          tool.id === id ? { ...tool, ...updatedTool } : tool
        )
      })));
    } catch (error) {
      console.error('Failed to update tool:', error);
      throw error;
    }
  };

  const deleteTool = async (id: number) => {
    try {
      await apiClient.deleteTool(id);
      setTools(tools.filter(tool => tool.id !== id));
    } catch (error) {
      console.error('Failed to delete tool:', error);
      throw error;
    }
  };

  const addWorker = async (worker: Omit<Worker, 'id'>) => {
    try {
      const newWorker = await apiClient.createWorker(worker);
      setWorkers([...workers, newWorker]);
    } catch (error) {
      console.error('Failed to add worker:', error);
      throw error;
    }
  };

  const updateWorker = async (id: number, updatedWorker: Partial<Worker>) => {
    try {
      const updated = await apiClient.updateWorker(id, updatedWorker);
      setWorkers(workers.map(worker => worker.id === id ? updated : worker));
    } catch (error) {
      console.error('Failed to update worker:', error);
      throw error;
    }
  };

  const deleteWorker = async (id: number) => {
    try {
      await apiClient.deleteWorker(id);
      setWorkers(workers.filter(worker => worker.id !== id));
    } catch (error) {
      console.error('Failed to delete worker:', error);
      throw error;
    }
  };

  const addProject = async (project: Omit<Project, 'id'>) => {
    try {
      const newProject = await apiClient.createProject(project);
      setProjects([...projects, newProject]);
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  };

  const updateProject = async (id: number, updatedProject: Partial<Project>) => {
    try {
      const updated = await apiClient.updateProject(id, updatedProject);
      setProjects(projects.map(project => project.id === id ? updated : project));
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await apiClient.deleteProject(id);
      setProjects(projects.filter(project => project.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  };

  const createAssignment = async (assignment: Omit<Assignment, 'id' | 'status'>) => {
    try {
      const toolIds = assignment.tools.map(tool => tool.id);
      const assignmentData = {
        checkoutDate: assignment.checkoutDate,
        workerId: assignment.worker.id,
        projectId: assignment.project.id,
        toolIds
      };

      const newAssignment = await apiClient.createAssignment(assignmentData);
      setAssignments([...assignments, newAssignment]);

      // Refresh tools to get updated statuses
      const updatedTools = await apiClient.getTools();
      setTools(updatedTools);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      throw error;
    }
  };

  const checkInAssignment = async (
    id: number,
    checkinNotes?: string,
    toolConditions?: Record<number, 'good' | 'damaged' | 'lost'>
  ) => {
    try {
      const updatedAssignment = await apiClient.checkinAssignment(id, {
        checkinNotes,
        toolConditions
      });

      setAssignments(assignments.map(assignment =>
        assignment.id === id ? updatedAssignment : assignment
      ));

      // Refresh tools to get updated statuses
      const updatedTools = await apiClient.getTools();
      setTools(updatedTools);
    } catch (error) {
      console.error('Failed to check in assignment:', error);
      throw error;
    }
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
