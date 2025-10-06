import type { Tool, Worker, Project, Assignment } from '@/contexts/AppDataContext';

// API client for QTools backend
const API_BASE_URL = import.meta.env.VITE_API_URL === 'auto' 
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : import.meta.env.VITE_API_URL || 'https://localhost:3000/api';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Tools API
  async getTools(): Promise<Tool[]> {
    return this.request<Tool[]>('/tools');
  }

  async getTool(id: number): Promise<Tool> {
    return this.request<Tool>(`/tools/${id}`);
  }

  async createTool(tool: Omit<Tool, 'id'>): Promise<Tool> {
    // Prepare the tool data with properly stringified customAttributes
    const toolData = {
      ...tool,
      customAttributes: JSON.stringify(tool.customAttributes || {})
    };
    
    return this.request<Tool>('/tools', {
      method: 'POST',
      body: JSON.stringify(toolData),
    });
  }

  async updateTool(id: number, tool: Partial<Tool>): Promise<Tool> {
    // Prepare the tool data with properly stringified customAttributes
    const toolData = {
      ...tool,
      ...(tool.customAttributes && { customAttributes: JSON.stringify(tool.customAttributes) })
    };
    
    return this.request<Tool>(`/tools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toolData),
    });
  }

  async deleteTool(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tools/${id}`, {
      method: 'DELETE',
    });
  }

  // Workers API
  async getWorkers(): Promise<Worker[]> {
    return this.request<Worker[]>('/workers');
  }

  async createWorker(worker: Omit<Worker, 'id'>): Promise<Worker> {
    return this.request<Worker>('/workers', {
      method: 'POST',
      body: JSON.stringify(worker),
    });
  }

  async updateWorker(id: number, worker: Partial<Worker>): Promise<Worker> {
    return this.request<Worker>(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(worker),
    });
  }

  async deleteWorker(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workers/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects API
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Assignments API
  async getAssignments(): Promise<Assignment[]> {
    return this.request<Assignment[]>('/assignments');
  }

  async createAssignment(assignment: {
    checkoutDate: string;
    workerId: number;
    projectId: number;
    toolIds: number[];
  }): Promise<Assignment> {
    return this.request<Assignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  async checkinAssignment(id: number, data: {
    checkinNotes?: string;
    toolConditions?: Record<number, 'good' | 'damaged' | 'lost'>;
  }): Promise<Assignment> {
    return this.request<Assignment>(`/assignments/${id}/checkin`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();