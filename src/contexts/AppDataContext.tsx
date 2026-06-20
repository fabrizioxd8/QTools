import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface Tool {
  id: number;
  name: string;
  category: string;
  status: 'Available' | 'In Use' | 'Damaged' | 'Lost' | 'Cal. Due' | 'Missing';
  isCalibrable: boolean;
  calibrationDue?: string;
  certificateNumber?: string;
  quantity?: number;
  damagedQuantity?: number;
  lostQuantity?: number;
  inUseQuantity?: number;
  missingQuantity?: number;
  availableQuantity?: number;
  // image can be a URL (string) or a File when the user selects one locally
  image?: string | File | null;
  customAttributes: Record<string, string>;
  // Calibration extended fields
  calibration_company?: string | null;
  last_calibration_date?: string | null;
  calibration_frequency_months?: number;
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

export type ToolConditionString = 'good' | 'damaged' | 'lost' | 'missing';
export type ToolConditionMap = Record<ToolConditionString, number>;

export interface Assignment {
  id: number;
  checkoutDate: string;
  guiaNumber?: string;
  checkoutNotes?: string;
  worker: Worker;
  project: Project;
  tools: Tool[];
  checkinDate?: string;
  status: 'active' | 'completed';
  checkinNotes?: string;
  return_guide?: string | null;
  // Supports both legacy string format and new per-condition quantity map
  toolConditions?: Record<number, ToolConditionString | ToolConditionMap>;
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
  checkInAssignment: (id: number, checkinDate?: string, checkinNotes?: string, toolConditions?: Record<number, ToolConditionMap>, return_guide?: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const enrichToolsWithAssignments = (toolsList: Tool[], asgs: Assignment[]) => {
  return toolsList.map(tool => {
    let inUse = 0;
    let damaged = 0;
    let lost = 0;
    let missing = 0;

    asgs.forEach(asg => {
      if (asg.status === 'active') {
        const t = asg.tools.find(t => t.id === tool.id);
        if (t) inUse += (t.quantity || 1);
      } else if (asg.status === 'completed' && asg.toolConditions) {
        const cond = asg.toolConditions[tool.id];
        if (cond) {
          if (typeof cond === 'object') {
            damaged += (Number((cond as ToolConditionMap).damaged) || 0);
            lost += (Number((cond as ToolConditionMap).lost) || 0);
            missing += (Number((cond as ToolConditionMap).missing) || 0);
          } else if (typeof cond === 'string') {
            const qty = asg.tools.find(t => t.id === tool.id)?.quantity || 1;
            if (cond === 'damaged') damaged += qty;
            if (cond === 'lost') lost += qty;
            if (cond === 'missing') missing += qty;
          }
        }
      }
    });

    const totalOwned = tool.quantity || 1;
    const available = Math.max(0, totalOwned - inUse - damaged - lost - missing);

    let correctStatus = tool.status;
    if (tool.status === 'Cal. Due') {
      correctStatus = 'Cal. Due'; // Preserve explicitly set Cal. Due state
    } else if (available > 0) correctStatus = 'Available';
    else if (inUse > 0) correctStatus = 'In Use';
    else if (missing > 0) correctStatus = 'Missing';
    else if (damaged > 0) correctStatus = 'Damaged';
    else if (lost > 0) correctStatus = 'Lost';

    // Auto-fix backend DB implicitly if a mismatched status overwrite is detected
    if (tool.status !== correctStatus) {
      apiClient.updateTool(tool.id, { status: correctStatus }).catch(console.error);
    }

    return {
      ...tool,
      status: correctStatus as Tool['status'],
      damagedQuantity: damaged,
      lostQuantity: lost,
      inUseQuantity: inUse,
      missingQuantity: missing,
      availableQuantity: available
    };
  });
};

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

        // Fix all misconfigured item statuses and separate their quantities appropriately
        setTools(enrichToolsWithAssignments(toolsData, assignmentsData));
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
      setTools(enrichToolsWithAssignments([...tools, newTool], assignments));
    } catch (error) {
      console.error('Failed to add tool:', error);
      throw error;
    }
  };

  const updateTool = async (id: number, updatedTool: Partial<Tool>) => {
    try {
      const updated = await apiClient.updateTool(id, updatedTool);
      const newTools = tools.map(tool => tool.id === id ? updated : tool);
      setTools(enrichToolsWithAssignments(newTools, assignments));

      // Update tools in active assignments (but preserve assignment-specific fields like quantity)
      // Only update display fields like name, category, status, etc.
      const { quantity, ...displayUpdates } = updatedTool;
      setAssignments(assignments.map(assignment => ({
        ...assignment,
        tools: assignment.tools.map(tool =>
          tool.id === id ? { ...tool, ...displayUpdates } : tool
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
      // Send tools with quantities (default 1) to support quantity-aware assignments
      const toolsPayload = assignment.tools.map(tool => ({ toolId: tool.id, quantity: tool.quantity || 1 }));
      const assignmentData = {
        checkoutDate: assignment.checkoutDate,
        checkoutNotes: assignment.checkoutNotes,
        guiaNumber: assignment.guiaNumber,
        workerId: assignment.worker.id,
        projectId: assignment.project.id,
        tools: toolsPayload
      };

      const newAssignment = await apiClient.createAssignment(assignmentData);
      const newAssignments = [newAssignment, ...assignments];
      // Add new assignment at the beginning to maintain DESC order (newest first)
      setAssignments(newAssignments);

      // Refresh tools to get updated statuses
      const updatedTools = await apiClient.getTools();
      setTools(enrichToolsWithAssignments(updatedTools, newAssignments));
    } catch (error) {
      console.error('Failed to create assignment:', error);
      throw error;
    }
  };

  const checkInAssignment = async (
    id: number,
    checkinDate?: string,
    checkinNotes?: string,
    toolConditions?: Record<number, ToolConditionMap>,
    return_guide?: string
  ) => {
    try {
      // If caller provided a full ISO datetime (includes 'T'), use it as-is.
      // Otherwise treat a date-only string as local date and preserve previous noon-fallback.
      let checkinDateTime: string | undefined;
      if (checkinDate) {
        if (checkinDate.includes('T')) {
          checkinDateTime = checkinDate;
        } else {
          const [year, month, day] = checkinDate.split('-').map(Number);
          // preserve old behavior for date-only: set to noon to avoid date shifts
          const dateTime = new Date(year, month - 1, day, 12, 0, 0);
          checkinDateTime = dateTime.toISOString();
        }
      }

      const updatedAssignment = await apiClient.checkinAssignment(id, {
        checkinDate: checkinDateTime,
        checkinNotes,
        toolConditions,
        return_guide,
      });

      const newAssignments = assignments.map(assignment =>
        assignment.id === id ? updatedAssignment : assignment
      );
      setAssignments(newAssignments);

      // Refresh tools to get updated statuses
      const updatedTools = await apiClient.getTools();
      setTools(enrichToolsWithAssignments(updatedTools, newAssignments));
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
