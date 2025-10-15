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

  // Type guard to detect File-like objects without using 'any' at usage sites
  private isFileLike(obj: unknown): obj is File {
    return !!obj && typeof obj === 'object' && 'size' in (obj as Record<string, unknown>) && 'name' in (obj as Record<string, unknown>);
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
    // Create FormData for proper file/data handling
    const formData = new FormData();
    
    formData.append('name', tool.name);
    formData.append('category', tool.category);
    formData.append('status', tool.status);
    formData.append('isCalibrable', tool.isCalibrable.toString());
    if (tool.certificateNumber) formData.append('certificateNumber', tool.certificateNumber);
    if (typeof tool.quantity !== 'undefined') formData.append('quantity', String(tool.quantity));
    
    if (tool.calibrationDue) {
      formData.append('calibrationDue', tool.calibrationDue);
    }
    
    // Handle image - if it's a File-like object, append as 'image' so multer can save it; if it's a URL/string, send as imageUrl
    if (this.isFileLike(tool.image)) {
      formData.append('image', tool.image as unknown as Blob);
    } else if (tool.image) {
      formData.append('imageUrl', tool.image as string);
    }
    
    formData.append('customAttributes', JSON.stringify(tool.customAttributes || {}));
    
    const url = `${this.baseUrl}/tools`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData, // Send as FormData instead of JSON
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json() as Tool;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  async updateTool(id: number, tool: Partial<Tool>): Promise<Tool> {
    // Create FormData for proper file/data handling
    const formData = new FormData();
    
    if (tool.name) formData.append('name', tool.name);
    if (tool.category) formData.append('category', tool.category);
    if (tool.status) formData.append('status', tool.status);
    if (tool.isCalibrable !== undefined) formData.append('isCalibrable', tool.isCalibrable.toString());
    if (tool.calibrationDue) formData.append('calibrationDue', tool.calibrationDue);
    if (tool.image && this.isFileLike(tool.image)) {
      formData.append('image', tool.image as unknown as Blob);
    } else if (tool.image) {
      formData.append('imageUrl', tool.image as string);
    }
    if (tool.customAttributes) formData.append('customAttributes', JSON.stringify(tool.customAttributes));
    if (tool.certificateNumber !== undefined) formData.append('certificateNumber', tool.certificateNumber || '');
    if (tool.quantity !== undefined) formData.append('quantity', String(tool.quantity));
    
    const url = `${this.baseUrl}/tools/${id}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json() as Tool;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
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
    tools: { toolId: number; quantity: number }[];
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

// Helper to build an absolute URL for uploaded files stored under /uploads on the API server
export function getUploadUrl(path?: string | null) {
  if (!path) return '';
  // If it's already an absolute URL, return as-is
  if (typeof path === 'string' && (/^https?:\/\//i).test(path)) return path;

  // Determine API origin similar to API_BASE_URL logic
  const apiSetting = import.meta.env.VITE_API_URL;
  const origin = apiSetting === 'auto'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : (apiSetting || 'https://localhost:3000');

  // If path already includes leading slash, just concatenate
  if (path.startsWith('/')) return `${origin}${path}`;
  return `${origin}/${path}`;
}