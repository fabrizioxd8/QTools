import React, { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Grid3X3, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUploadBox } from '@/components/ImageUploadBox';
import { useAppData, Tool, ToolConditionMap } from '@/contexts/AppDataContext';
import { matchesSearch } from '@/lib/search';
import { getUploadUrl } from '@/lib/api';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ExtendedTool = Tool & Partial<{ certificateNumber: string; quantity: number }>;
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const categories = ['Electrical', 'Mechanical', 'Safety', 'Measurement', 'Hand Tools', 'Power Tools', 'Cleaning and Maintenance', 'Workstation Equipment'];
const statuses: (Tool['status'] | 'Missing')[] = ['Available', 'In Use', 'Damaged', 'Lost', 'Missing', 'Cal. Due'];

// These are the canonical English keys stored in the DB — keep as-is
const standardAttributes = ['Brand', 'Model', 'Serial Number', 'Custom'];

// Map from DB-stored English category value → i18n key suffix
const categoryKeyMap: Record<string, string> = {
  'Electrical': 'electrical',
  'Mechanical': 'mechanical',
  'Safety': 'safety',
  'Measurement': 'measurement',
  'Hand Tools': 'handTools',
  'Power Tools': 'powerTools',
  'Cleaning and Maintenance': 'cleaning',
  'Workstation Equipment': 'workstation',
};

// Map from DB-stored English status value → i18n key suffix
const statusKeyMap: Record<string, string> = {
  'Available': 'Available',
  'In Use': 'In Use',
  'Damaged': 'Damaged',
  'Lost': 'Lost',
  'Missing': 'Missing',
  'Cal. Due': 'Cal. Due',
};

export default function ToolsManager() {
  const { tools, addTool, updateTool, deleteTool, assignments } = useAppData();
  const { t } = useTranslation();

  // Translate a stored attribute key to the current language's label
  const tAttrKey = (key: string) => t(`tools.attrKeys.${key}`, { defaultValue: key });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Layout controls
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);

  // Sort controls
  const [sortField, setSortField] = useState<'name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Reset to unsorted
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'name') => {
    if (sortField !== field) return ArrowUpDown;
    return sortDirection === 'asc' ? ArrowUp : ArrowDown;
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: 'Available' as Tool['status'],
    isCalibrable: false,
    calibrationDue: '',
    certificateNumber: '',
    quantity: 1,
    image: null as string | File | null,
    customAttributes: {} as Record<string, string>,
    calibration_company: '',
    last_calibration_date: '',
    calibration_frequency_months: 12,
  });

  const [newAttrKeyType, setNewAttrKeyType] = useState('Brand');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');
  const [draggedAttrIndex, setDraggedAttrIndex] = useState<number | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const storedSearch = window.localStorage.getItem('toolSearchTerm');
    if (storedSearch) {
      setSearchQuery(storedSearch);
      window.localStorage.removeItem('toolSearchTerm');
    }
    const storedStatusFilter = window.localStorage.getItem('toolStatusFilter');
    if (storedStatusFilter) {
      setStatusFilter(storedStatusFilter);
      window.localStorage.removeItem('toolStatusFilter');
    }
  }, []);

  // Dynamic read-only logic based on filtered status
  const isReadOnly = statusFilter !== 'All' && statusFilter !== 'Available';

  const filteredTools = tools
    .filter(tool => {
      const extTool = tool as ExtendedTool;
      const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
      let matchesStatus = false;

      if (statusFilter === 'All') {
        matchesStatus = true;
      } else if (statusFilter === 'Damaged') {
        // Match global status OR specific damaged quantity OR items marked damaged in check-ins
        const hasDamagedInAsg = assignments.some(asg => {
          const cond = asg.toolConditions?.[tool.id];
          return cond && (typeof cond === 'object' ? Number((cond as ToolConditionMap).damaged) > 0 : cond === 'damaged');
        });
        matchesStatus = tool.status === 'Damaged' || ((tool.damagedQuantity || 0) > 0) || hasDamagedInAsg;
      } else if (statusFilter === 'Lost') {
        const hasLostInAsg = assignments.some(asg => {
          const cond = asg.toolConditions?.[tool.id];
          return cond && (typeof cond === 'object' ? Number((cond as ToolConditionMap).lost) > 0 : cond === 'lost');
        });
        matchesStatus = tool.status === 'Lost' || ((tool.lostQuantity || 0) > 0) || hasLostInAsg;
      } else if (statusFilter === 'Available') {
        matchesStatus = tool.status === 'Available' || ((extTool.availableQuantity || 0) > 0);
      } else if (statusFilter === 'Missing') {
        // Match tools that have missing qty in any completed assignment
        matchesStatus = assignments.some(asg => {
          if (asg.status !== 'completed' || !asg.toolConditions) return false;
          const cond = asg.toolConditions[tool.id];
          if (!cond) return false;
          if (typeof cond === 'object') return Number((cond as ToolConditionMap).missing) > 0;
          return cond === 'missing';
        });
      } else if (statusFilter === 'Cal. Due') {
        // Match tools with status 'Cal. Due' OR calibrable tools with overdue/soon calibration
        if (tool.status === 'Cal. Due') {
          matchesStatus = true;
        } else if (tool.isCalibrable && tool.calibrationDue) {
          const dueDate = new Date(tool.calibrationDue);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          const thirtyDaysFromNow = new Date(today);
          thirtyDaysFromNow.setDate(today.getDate() + 30);
          matchesStatus = dueDate <= thirtyDaysFromNow;
        }
      } else if (statusFilter === 'In Use') {
        matchesStatus = tool.status === 'In Use' || ((extTool.inUseQuantity || 0) > 0);
      } else {
        matchesStatus = tool.status === statusFilter;
      }

      const matches = matchesSearch(tool.name, searchQuery);
      return matchesCategory && matchesStatus && matches;
    })
    .sort((a, b) => {
      if (!sortField) return 0;

      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const openDialog = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      const t = tool as Tool & Partial<{ certificateNumber: string; quantity: number; inUseQuantity: number; damagedQuantity: number; lostQuantity: number; missingQuantity: number }>;

      let displayQty = t.quantity || 1;
      if (isReadOnly) {
        if (statusFilter === 'In Use') displayQty = t.inUseQuantity || 0;
        else if (statusFilter === 'Damaged') displayQty = t.damagedQuantity || 0;
        else if (statusFilter === 'Lost') displayQty = t.lostQuantity || 0;
        else if (statusFilter === 'Missing') displayQty = t.missingQuantity || 0;
      }

      setFormData({
        name: tool.name,
        category: tool.category,
        status: tool.status,
        isCalibrable: tool.isCalibrable,
        calibrationDue: tool.calibrationDue || '',
        certificateNumber: t.certificateNumber || '',
        quantity: displayQty,
        image: tool.image || null,
        customAttributes: { ...tool.customAttributes },
        calibration_company: tool.calibration_company || '',
        last_calibration_date: tool.last_calibration_date || '',
        calibration_frequency_months: tool.calibration_frequency_months ?? 12,
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: '',
        category: '',
        status: 'Available',
        isCalibrable: false,
        calibrationDue: '',
        certificateNumber: '',
        quantity: 1,
        image: null,
        customAttributes: {},
        calibration_company: '',
        last_calibration_date: '',
        calibration_frequency_months: 12,
      });
    }
    // Clear custom attribute input fields
    setNewAttrKeyType('Brand');
    setNewAttrKey('');
    setNewAttrValue('');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    // Check if there are unsaved custom attributes
    const isCustom = newAttrKeyType === 'Custom';

    if (newAttrValue.trim() || (isCustom && newAttrKey.trim())) {
      setShowUnsavedWarning(true);
      return;
    }
    setIsDialogOpen(false);
    // Clear custom attribute input fields when closing
    setNewAttrKeyType('Brand');
    setNewAttrKey('');
    setNewAttrValue('');
  };

  const confirmCloseDialog = () => {
    setShowUnsavedWarning(false);
    setIsDialogOpen(false);
    setNewAttrKeyType('Brand');
    setNewAttrKey('');
    setNewAttrValue('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error(t('tools.requiredFields'));
      return;
    }

    // Check if there are unsaved custom attributes
    const isCustom = newAttrKeyType === 'Custom';

    if (newAttrValue.trim() || (isCustom && newAttrKey.trim())) {
      toast.error(t('tools.unsavedAttributeWarning'));
      return;
    }

    try {
      if (editingTool) {
        await updateTool(editingTool.id, { ...formData });
        toast.success(t('tools.updateSuccess'));
      } else {
        await addTool({ ...formData });
        toast.success(t('tools.addSuccess'));
      }
      setIsDialogOpen(false);
      // Clear custom attribute input fields
      setNewAttrKey('');
      setNewAttrValue('');
    } catch (error) {
      toast.error(t('tools.saveFailed'));
      console.error('Error saving tool:', error);
    }
  };

  const isToolAssigned = (toolId: number): boolean => {
    return assignments.some(assignment =>
      assignment.status === 'active' &&
      assignment.tools.some(tool => tool.id === toolId)
    );
  };

  const handleDeleteAttempt = (id: number) => {
    // Check if tool is assigned to any active assignment
    if (isToolAssigned(id)) {
      toast.error(t('tools.cannotDeleteAssigned'));
      return;
    }
    setDeleteConfirmId(id);
  };

  const renderCalibrationStatus = (tool: Tool) => {
    if (!tool.isCalibrable || !tool.calibrationDue) return null;

    const dueDate = new Date(tool.calibrationDue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    let state = 'ok';
    if (dueDate < today) state = 'overdue';
    else if (dueDate <= thirtyDaysFromNow) state = 'soon';

    let style = '';
    let Icon = Calendar;

    if (state === 'overdue') {
      style = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200/60 dark:border-red-700/40';
      Icon = AlertTriangle;
    } else if (state === 'soon') {
      style = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200/60 dark:border-yellow-700/40';
      Icon = AlertTriangle;
    } else {
      style = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200/60 dark:border-green-700/40';
      Icon = CheckCircle;
    }

    return (
      <div className="mt-3 mb-2">
        <Badge variant="outline" className={`flex w-fit items-center gap-1.5 ${style}`}>
          <Icon className="h-3 w-3" />
          <span>{t('tools.calDueLabel')}: {dueDate.toLocaleDateString()}</span>
        </Badge>
      </div>
    );
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTool(id);
      toast.success(t('tools.deleteSuccess'));
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error(t('tools.deleteFailed'));
      console.error('Error deleting tool:', error);
    }
  };

  const addCustomAttribute = () => {
    const isCustom = newAttrKeyType === 'Custom';
    const keyToUse = isCustom ? newAttrKey : newAttrKeyType;

    if (keyToUse && newAttrValue) {
      setFormData({
        ...formData,
        customAttributes: {
          ...formData.customAttributes,
          [keyToUse]: newAttrValue,
        },
      });
      setNewAttrKeyType('Brand');
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  const removeCustomAttribute = (key: string) => {
    const newAttrs = { ...formData.customAttributes };
    delete newAttrs[key];
    setFormData({ ...formData, customAttributes: newAttrs });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedAttrIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedAttrIndex === null || draggedAttrIndex === dropIndex) return;

    const entries = Object.entries(formData.customAttributes);
    const [draggedEntry] = entries.splice(draggedAttrIndex, 1);
    entries.splice(dropIndex, 0, draggedEntry);

    const reorderedAttrs = Object.fromEntries(entries);
    setFormData({ ...formData, customAttributes: reorderedAttrs });
    setDraggedAttrIndex(null);
  };

  const getStatusBadgeVariant = (status: Tool['status']) => {
    switch (status) {
      case 'Available': return 'secondary';
      case 'In Use': return 'default';
      case 'Damaged':
      case 'Lost': return 'destructive';
      case 'Cal. Due': return 'secondary';
      default: return 'default';
    }
  };

  // Build tooltip entries for a tool showing "In Use":
  // - Active assignments contribute real project + qty
  // - Completed assignments with missing qty contribute "Missing (Project)" entries
  const buildInUseEntries = (toolId: number): Array<{ projectName: string; qty: number; missing?: boolean }> => {
    const entries: Array<{ projectName: string; qty: number; missing?: boolean }> = [];
    assignments.forEach(asg => {
      if (asg.status === 'active') {
        asg.tools.forEach(t => {
          if (t.id === toolId && (t.quantity || 1) > 0) {
            entries.push({ projectName: asg.project.name, qty: t.quantity || 1 });
          }
        });
      }
      if (asg.status === 'completed' && asg.toolConditions) {
        const cond = asg.toolConditions[toolId];
        if (cond && typeof cond === 'object') {
          const missingQty = Number((cond as ToolConditionMap).missing) || 0;
          if (missingQty > 0) {
            entries.push({ projectName: asg.project.name, qty: missingQty, missing: true });
          }
        } else if (cond === 'missing') {
          const toolInAsg = asg.tools.find(t => t.id === toolId);
          if (toolInAsg) entries.push({ projectName: asg.project.name, qty: toolInAsg.quantity || 1, missing: true });
        }
      }
    });
    return entries;
  };

  const renderInUseBadge = (toolId: number) => {
    const entries = buildInUseEntries(toolId);
    const hasEntries = entries.length > 0;

    return (
      <Tooltip key={`in-use-${toolId}`}>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            <Badge variant={getStatusBadgeVariant('In Use')}>In Use</Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {hasEntries ? (
            <div className="space-y-1">
              {entries.map((e, i) => (
                <div key={i} className="text-sm">
                  {e.missing
                    ? <><span className="text-yellow-400 font-semibold">Missing</span> — last seen: <strong>{e.projectName}</strong> ({e.qty})</>
                    : <><strong>{e.projectName}</strong>: {e.qty}</>
                  }
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active assignment data</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  };

  const handleExportExcel = () => {
    try {
      const data: Record<string, string | number>[] = [];
      const toolsToExport = filteredTools;

      toolsToExport.forEach(tool => {
        const extTool = tool as ExtendedTool & { damagedQuantity?: number; lostQuantity?: number };

        // Gather active assignment info for this tool
        const activeAssignments = assignments.filter(asg =>
          asg.status === 'active' && asg.tools.some(t => t.id === tool.id)
        );

        const inUseTotal = activeAssignments.reduce((sum, asg) => {
          const t = asg.tools.find(t => t.id === tool.id);
          return sum + (t?.quantity || 1);
        }, 0);

        const assignedProjectList = Array.from(
          new Set(activeAssignments.map(asg => asg.project.name))
        ).join(', ');

        // Get guia de remision: from the most recent active assignment for this tool
        // If no active, try the most recent completed assignment
        let guiaDeRemision = '';
        if (activeAssignments.length > 0) {
          // Sort by checkoutDate desc, take first
          const lastActive = [...activeAssignments].sort(
            (a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime()
          )[0];
          guiaDeRemision = lastActive.guiaNumber || '';
        } else {
          // No active assignment — look at completed ones that had this tool
          const completedWithTool = assignments
            .filter(asg => asg.status === 'completed' && asg.tools.some(t => t.id === tool.id))
            .sort((a, b) => {
              const aDate = a.checkinDate ? new Date(a.checkinDate).getTime() : 0;
              const bDate = b.checkinDate ? new Date(b.checkinDate).getTime() : 0;
              return bDate - aDate;
            });
          if (completedWithTool.length > 0) {
            guiaDeRemision = completedWithTool[0].guiaNumber || '';
          }
        }

        // Build extra information from non-standard custom attributes
        const standardKeys = standardAttributes.filter(attr => attr !== 'Custom');
        // Keys that are already mapped to dedicated columns — exclude from Observaciones
        const dedicatedKeys = new Set([
          'Brand', 'Marca', 'brand', 'marca',
          'Model', 'Modelo', 'model', 'modelo',
          'Serial Number', 'Serie', 'serial_number', 'serie',
        ]);
        const extraInfo: string[] = [];
        Object.entries(tool.customAttributes).forEach(([key, value]) => {
          if (!standardKeys.includes(key) && !dedicatedKeys.has(key)) {
            extraInfo.push(`${key}: ${value}`);
          }
        });
        const observaciones = extraInfo.join(' | ');

        // Helper to build a row with the required Spanish headers
        const buildRow = (
          status: string,
          qty: number,
          projectAssigned: string,
          guia: string
        ): Record<string, string | number> => ({
          'Instrumento': tool.name,
          'Categoría': tool.category,
          'Marca': tool.customAttributes['Brand'] || tool.customAttributes['Marca'] || '',
          'Modelo': tool.customAttributes['Model'] || tool.customAttributes['Modelo'] || '',
          'Serie': tool.customAttributes['Serial Number'] || tool.customAttributes['Serie'] || '',
          'Estado del Equipo': status,
          'Cantidad': qty,
          'Proyecto Asignado': projectAssigned,
          'Guía de Remisión': guia,
          '¿Requiere Calibración?': tool.isCalibrable ? 'Sí' : 'No',
          'Empresa Certificadora': tool.isCalibrable ? (tool.calibration_company || '') : '',
          'Nº Certificado': extTool.certificateNumber || '',
          'Última Calibración': tool.isCalibrable ? (tool.last_calibration_date || '') : '',
          'Frecuencia (Meses)': tool.isCalibrable ? (tool.calibration_frequency_months ?? 12) : '',
          'Próxima Calibración': tool.isCalibrable ? (tool.calibrationDue || '') : '',
          'Observaciones': observaciones,
        });

        if (statusFilter === 'All') {
          let hasExported = false;

          if (extTool.quantity !== undefined && extTool.quantity > 0) {
            const displayStatus = (tool.status === 'Lost' || tool.status === 'Damaged' || tool.status === 'Cal. Due') ? tool.status : 'Available';
            data.push(buildRow(displayStatus, extTool.quantity, '', ''));
            hasExported = true;
          }
          if (inUseTotal > 0) {
            data.push(buildRow('In Use', inUseTotal, assignedProjectList, guiaDeRemision));
            hasExported = true;
          }

          const damagedTotal = assignments.reduce((sum, asg) => {
            if (asg.status !== 'completed' || !asg.toolConditions) return sum;
            const cond = asg.toolConditions[tool.id];
            if (!cond) return sum;
            if (typeof cond === 'object') return sum + (Number((cond as ToolConditionMap).damaged) || 0);
            return cond === 'damaged' ? sum + (asg.tools.find(t => t.id === tool.id)?.quantity || 1) : sum;
          }, 0);
          const lostTotal = assignments.reduce((sum, asg) => {
            if (asg.status !== 'completed' || !asg.toolConditions) return sum;
            const cond = asg.toolConditions[tool.id];
            if (!cond) return sum;
            if (typeof cond === 'object') return sum + (Number((cond as ToolConditionMap).lost) || 0);
            return cond === 'lost' ? sum + (asg.tools.find(t => t.id === tool.id)?.quantity || 1) : sum;
          }, 0);
          const missingTotal = assignments.reduce((sum, asg) => {
            if (asg.status !== 'completed' || !asg.toolConditions) return sum;
            const cond = asg.toolConditions[tool.id];
            if (!cond) return sum;
            if (typeof cond === 'object') return sum + (Number((cond as ToolConditionMap).missing) || 0);
            return cond === 'missing' ? sum + (asg.tools.find(t => t.id === tool.id)?.quantity || 1) : sum;
          }, 0);

          const damagedQty = damagedTotal > 0 ? damagedTotal : (extTool.damagedQuantity || 0);
          const lostQty = lostTotal > 0 ? lostTotal : (extTool.lostQuantity || 0);
          if (damagedQty > 0 && tool.status !== 'Damaged') { data.push(buildRow('Damaged', damagedQty, '', '')); hasExported = true; }
          if (lostQty > 0 && tool.status !== 'Lost') { data.push(buildRow('Lost', lostQty, '', '')); hasExported = true; }
          if (missingTotal > 0) { data.push(buildRow('Missing', missingTotal, '', '')); hasExported = true; }

          const isCalDue = (() => {
            if (!tool.isCalibrable || !tool.calibrationDue) return false;
            if (tool.status === 'Cal. Due') return true;
            const dueDate = new Date(`${tool.calibrationDue}T00:00:00`);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const thirtyDaysFromNow = new Date(today); thirtyDaysFromNow.setDate(today.getDate() + 30);
            return dueDate <= thirtyDaysFromNow;
          })();
          if (isCalDue) {
            const calQty = (extTool.quantity || 0) + inUseTotal;
            data.push(buildRow('Cal. Due', calQty > 0 ? calQty : 1, assignedProjectList, guiaDeRemision));
            hasExported = true;
          }

          if (!hasExported) {
            data.push(buildRow(tool.status, extTool.quantity || 0, assignedProjectList, guiaDeRemision));
          }
        } else {
          // Filtered view — single row per tool based on active filter
          if (statusFilter === 'In Use') {
            data.push(buildRow('In Use', inUseTotal || (extTool as { inUseQuantity?: number }).inUseQuantity || 0, assignedProjectList, guiaDeRemision));
          } else if (statusFilter === 'Damaged') {
            data.push(buildRow('Damaged', (extTool as { damagedQuantity?: number }).damagedQuantity || 0, '', ''));
          } else if (statusFilter === 'Lost') {
            data.push(buildRow('Lost', (extTool as { lostQuantity?: number }).lostQuantity || 0, '', ''));
          } else if (statusFilter === 'Missing') {
            data.push(buildRow('Missing', (extTool as { missingQuantity?: number }).missingQuantity || 0, '', ''));
          } else if (statusFilter === 'Cal. Due') {
            const calQty = (extTool.quantity || 0) + inUseTotal;
            data.push(buildRow('Cal. Due', calQty > 0 ? calQty : 1, assignedProjectList, guiaDeRemision));
          } else {
            data.push(buildRow(tool.status, extTool.quantity || 1, assignedProjectList, guiaDeRemision));
          }
        }
      });

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

      // --- Formatting ---
      const numRows = data.length;
      const numCols = data.length > 0 ? Object.keys(data[0]).length : 0;

      if (numRows > 0 && numCols > 0) {
        const colLetter = (n: number) => {
          let s = '';
          let col = n;
          while (col >= 0) {
            s = String.fromCharCode((col % 26) + 65) + s;
            col = Math.floor(col / 26) - 1;
          }
          return s;
        };

        const lastCol = colLetter(numCols - 1);
        worksheet['!autofilter'] = { ref: `A1:${lastCol}1` };
        worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

        const colWidths = Object.keys(data[0]).map(header => {
          const maxLen = data.reduce((max, row) => {
            const val = row[header];
            return Math.max(max, val !== undefined && val !== null ? String(val).length : 0);
          }, header.length);
          return { wch: Math.min(maxLen + 2, 50) };
        });
        worksheet['!cols'] = colWidths;

        const headers = Object.keys(data[0]);
        headers.forEach((_, colIdx) => {
          const cellAddr = `${colLetter(colIdx)}1`;
          if (!worksheet[cellAddr]) return;
          worksheet[cellAddr].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '0F766E' }, patternType: 'solid' },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
            border: { bottom: { style: 'thin', color: { rgb: 'CCCCCC' } } },
          };
        });

        for (let rowIdx = 2; rowIdx <= numRows + 1; rowIdx++) {
          const fillColor = rowIdx % 2 === 0 ? 'E6F4F3' : 'FFFFFF';
          for (let colIdx = 0; colIdx < numCols; colIdx++) {
            const cellAddr = `${colLetter(colIdx)}${rowIdx}`;
            if (!worksheet[cellAddr]) continue;
            worksheet[cellAddr].s = {
              fill: { fgColor: { rgb: fillColor }, patternType: 'solid' },
              alignment: { vertical: 'center' },
              border: { bottom: { style: 'hair', color: { rgb: 'DDDDDD' } } },
            };
          }
        }
      }

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

      // Save file
      const dateString = new Date().toISOString().split('T')[0];
      saveAs(dataBlob, `Inventario_${dateString}.xlsx`);

      toast.success(t('tools.exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('tools.exportFailed'));
    }
  };

  // Handle Ctrl+F to focus search bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('tools.title')}</h1>
          <p className="text-muted-foreground">{t('tools.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            {t('tools.exportExcel')}
          </Button>
          <Button onClick={() => openDialog()} disabled={isReadOnly}>
            <Plus className="mr-2 h-4 w-4" />
            {t('tools.addNewTool')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('common.category')}</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t('tools.allCategories')}</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {t(`tools.categories.${categoryKeyMap[cat]}`, { defaultValue: cat })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t('tools.allStatuses')}</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(`tools.statusLabels.${status}`, { defaultValue: status })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('common.search')}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={t('tools.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('common.view')}:</span>
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                {t('common.grid')}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1" />
                {t('common.list')}
              </Button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('common.sort')}:</span>
            <div className="flex items-center gap-1">
              {(() => {
                const Icon = getSortIcon('name');
                return (
                  <Button
                    variant={sortField === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-8 px-3"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {t('common.name')}
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('common.columns')}:</span>
            <div className="flex items-center border rounded-lg p-1">
              {[2, 3, 4].map((cols) => (
                <Button
                  key={cols}
                  variant={gridColumns === cols ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGridColumns(cols as 2 | 3 | 4)}
                  className="h-8 w-8 p-0"
                >
                  {cols}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tools Display */}
      {filteredTools.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">{t('tools.noToolsFound')}</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div
          className={`grid gap-4 ${gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
            gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}
        >
          {filteredTools.map(tool => (
            <Card key={tool.id} className="hover:shadow-lg transition-all hover:scale-105 flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <div className="aspect-square mb-4 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {tool.image ? (
                    <img src={getUploadUrl(tool.image as string)} alt={tool.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">🔧</span>
                  )}
                </div>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{tool.category}</Badge>
                  {/* Status badge with optional tooltip when In Use */}
                  {(() => {
                    const extTool = tool as ExtendedTool & { damagedQuantity?: number; lostQuantity?: number; inUseQuantity?: number; availableQuantity?: number; missingQuantity?: number };

                    if (statusFilter === 'All') {
                      const showInUse = (extTool.inUseQuantity || 0) > 0 || (extTool.missingQuantity || 0) > 0;
                      return (
                        <>
                          {tool.status !== 'In Use' && <Badge variant={getStatusBadgeVariant(tool.status)}>{tool.status}</Badge>}
                          {(showInUse || tool.status === 'In Use') && renderInUseBadge(tool.id)}
                        </>
                      );
                    }

                    let displayStatus = tool.status;

                    if (statusFilter === 'Damaged' && extTool.damagedQuantity && extTool.damagedQuantity > 0) {
                      displayStatus = 'Damaged';
                    } else if (statusFilter === 'Lost' && extTool.lostQuantity && extTool.lostQuantity > 0) {
                      displayStatus = 'Lost';
                    } else if (statusFilter === 'Available' && extTool.availableQuantity && extTool.availableQuantity > 0) {
                      displayStatus = 'Available';
                    } else if (statusFilter === 'Missing') {
                      displayStatus = 'In Use';
                    } else if (statusFilter === 'In Use') {
                      displayStatus = 'In Use';
                    } else if (statusFilter === 'Cal. Due') {
                      displayStatus = 'Cal. Due';
                    }

                    if (displayStatus === 'In Use') {
                      return renderInUseBadge(tool.id);
                    }

                    return <Badge variant={getStatusBadgeVariant(displayStatus)}>{displayStatus}</Badge>;
                  })()}
                  {/* Show quantity based on filter or if > 1 */}
                  {(() => {
                    const extTool = tool as ExtendedTool & { damagedQuantity?: number; lostQuantity?: number; inUseQuantity?: number; availableQuantity?: number; missingQuantity?: number };
                    let displayQty = extTool.quantity;
                    let prefix = t('common.quantity');

                    if (statusFilter === 'Damaged' && extTool.damagedQuantity && extTool.damagedQuantity > 0) {
                      displayQty = extTool.damagedQuantity;
                      prefix = t('common.quantity');
                    } else if (statusFilter === 'Lost' && extTool.lostQuantity && extTool.lostQuantity > 0) {
                      displayQty = extTool.lostQuantity;
                      prefix = t('common.quantity');
                    } else if (statusFilter === 'In Use') {
                      displayQty = extTool.inUseQuantity || 0;
                      prefix = t('common.quantity');
                    } else if (statusFilter === 'Available') {
                      displayQty = extTool.availableQuantity || 0;
                      prefix = t('common.quantity');
                    } else if (statusFilter === 'Missing') {
                      displayQty = extTool.missingQuantity || 0;
                      prefix = t('common.quantity');
                    } else if (statusFilter === 'All') {
                      prefix = t('common.total');
                    }

                    // Always show if filtering by Damaged, Lost, In Use, Missing, or Available and there is quantity
                    if ((statusFilter === 'Damaged' || statusFilter === 'Lost' || statusFilter === 'Missing' || statusFilter === 'In Use' || statusFilter === 'Available') && displayQty !== undefined && displayQty > 0) {
                      return <Badge variant="outline">{prefix}: {displayQty}</Badge>;
                    }

                    return displayQty !== undefined && displayQty !== null && displayQty > 1 ? (
                      <Badge variant="outline">{prefix}: {displayQty}</Badge>
                    ) : null;
                  })()}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  {Object.entries(tool.customAttributes).length > 0 && (
                    <div className="space-y-1 mb-4">
                      {Object.entries(tool.customAttributes).map(([key, value]) => (
                        <p key={key} className="text-sm text-muted-foreground">
                          <span className="font-medium">{tAttrKey(key)}:</span> {value}
                        </p>
                      ))}
                    </div>
                  )}

                  {renderCalibrationStatus(tool)}

                </div>

                {/* Action buttons fixed to bottom */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openDialog(tool)} className="flex-1">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAttempt(tool.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredTools.map(tool => (
            <Card key={tool.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Tool Image/Icon */}
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {tool.image ? (
                      <img src={getUploadUrl(tool.image as string)} alt={tool.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🔧</span>
                    )}
                  </div>

                  {/* Tool Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{tool.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{tool.category}</Badge>
                          {(() => {
                            const extTool = tool as ExtendedTool & { damagedQuantity?: number; lostQuantity?: number; inUseQuantity?: number; availableQuantity?: number; missingQuantity?: number };

                            if (statusFilter === 'All') {
                              const showInUse = (extTool.inUseQuantity || 0) > 0 || (extTool.missingQuantity || 0) > 0;
                              return (
                                <>
                                  {tool.status !== 'In Use' && <Badge variant={getStatusBadgeVariant(tool.status)}>{tool.status}</Badge>}
                                  {(showInUse || tool.status === 'In Use') && renderInUseBadge(tool.id)}
                                </>
                              );
                            }

                            let displayStatus = tool.status;

                            if (statusFilter === 'Damaged' && extTool.damagedQuantity && extTool.damagedQuantity > 0) {
                              displayStatus = 'Damaged';
                            } else if (statusFilter === 'Lost' && extTool.lostQuantity && extTool.lostQuantity > 0) {
                              displayStatus = 'Lost';
                            } else if (statusFilter === 'Available' && extTool.availableQuantity && extTool.availableQuantity > 0) {
                              displayStatus = 'Available';
                            } else if (statusFilter === 'Missing') {
                              displayStatus = 'In Use';
                            } else if (statusFilter === 'In Use') {
                              displayStatus = 'In Use';
                            } else if (statusFilter === 'Cal. Due') {
                              displayStatus = 'Cal. Due';
                            }

                            if (displayStatus === 'In Use') {
                              return renderInUseBadge(tool.id);
                            }

                            return <Badge variant={getStatusBadgeVariant(displayStatus)}>{displayStatus}</Badge>;
                          })()}
                          {/* Show quantity based on filter or if > 1 */}
                          {(() => {
                            const extTool = tool as ExtendedTool & { damagedQuantity?: number; lostQuantity?: number; inUseQuantity?: number; availableQuantity?: number; missingQuantity?: number };
                            let displayQty = extTool.quantity;
                            let prefix = t('common.quantity');

                            if (statusFilter === 'Damaged' && extTool.damagedQuantity && extTool.damagedQuantity > 0) {
                              displayQty = extTool.damagedQuantity;
                              prefix = t('common.quantity');
                            } else if (statusFilter === 'Lost' && extTool.lostQuantity && extTool.lostQuantity > 0) {
                              displayQty = extTool.lostQuantity;
                              prefix = t('common.quantity');
                            } else if (statusFilter === 'In Use') {
                              displayQty = extTool.inUseQuantity || 0;
                              prefix = t('common.quantity');
                            } else if (statusFilter === 'Available') {
                              displayQty = extTool.availableQuantity || 0;
                              prefix = t('common.quantity');
                            } else if (statusFilter === 'Missing') {
                              displayQty = extTool.missingQuantity || 0;
                              prefix = t('common.quantity');
                            } else if (statusFilter === 'All') {
                              prefix = t('common.total');
                            }

                            // Always show if filtering by Damaged, Lost, In Use, Missing, or Available and there is quantity
                            if ((statusFilter === 'Damaged' || statusFilter === 'Lost' || statusFilter === 'Missing' || statusFilter === 'In Use' || statusFilter === 'Available') && displayQty !== undefined && displayQty > 0) {
                              return <Badge variant="outline">{prefix}: {displayQty}</Badge>;
                            }

                            return displayQty !== undefined && displayQty !== null && displayQty > 1 ? (
                              <Badge variant="outline">{prefix}: {displayQty}</Badge>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => openDialog(tool)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAttempt(tool.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Custom Attributes */}
                    {Object.entries(tool.customAttributes).length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        {Object.entries(tool.customAttributes).map(([key, value]) => (
                          <span key={key}>
                            <span className="font-medium">{tAttrKey(key)}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Calibration Info */}
                    {renderCalibrationStatus(tool)}

                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsDialogOpen(true); }}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl">{editingTool ? t('tools.editTool') : t('tools.addTool')}</DialogTitle>
            <DialogDescription className="text-base">
              {editingTool ? t('tools.editToolDesc') : t('tools.addToolDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('tools.toolName')}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('tools.toolNamePlaceholder')}
                      disabled={isReadOnly}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('tools.categoryRequired')}</Label>
                    <Select disabled={isReadOnly} value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={t('tools.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {t(`tools.categories.${categoryKeyMap[cat]}`, { defaultValue: cat })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('common.status')}</Label>
                    <Select disabled={isReadOnly} value={formData.status} onValueChange={(value: Tool['status']) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {t(`tools.statusLabels.${status}`, { defaultValue: status })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('common.quantity')}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) || 1 })}
                      disabled={isReadOnly}
                      className="h-11 w-full max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('tools.quantityHint')}
                    </p>
                  </div>
                </div>

                {formData.isCalibrable && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.certifyingCompany')}</Label>
                        <Input
                          value={formData.calibration_company}
                          onChange={(e) => setFormData({ ...formData, calibration_company: e.target.value })}
                          disabled={isReadOnly}
                          placeholder={t('tools.certifyingCompanyPlaceholder')}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.certificateNumber')}</Label>
                        <Input
                          value={formData.certificateNumber}
                          onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                          disabled={isReadOnly}
                          placeholder={t('tools.certificateNumberPlaceholder')}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.lastCalibration')}</Label>
                        <Input
                          type="date"
                          value={formData.last_calibration_date}
                          onChange={(e) => {
                            const newLastDate = e.target.value;
                            // Auto-calculate next calibration due date
                            let newDue = formData.calibrationDue;
                            if (newLastDate && formData.calibration_frequency_months) {
                              const d = new Date(newLastDate);
                              if (!isNaN(d.getTime())) {
                                d.setMonth(d.getMonth() + Number(formData.calibration_frequency_months));
                                newDue = d.toISOString().split('T')[0];
                              }
                            }
                            setFormData({ ...formData, last_calibration_date: newLastDate, calibrationDue: newDue });
                          }}
                          disabled={isReadOnly}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.frequencyMonths')}</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.calibration_frequency_months}
                          onChange={(e) => {
                            const newFreq = Number(e.target.value) || 12;
                            // Recalculate due date if last_calibration_date is set
                            let newDue = formData.calibrationDue;
                            if (formData.last_calibration_date) {
                              const d = new Date(formData.last_calibration_date);
                              if (!isNaN(d.getTime())) {
                                d.setMonth(d.getMonth() + newFreq);
                                newDue = d.toISOString().split('T')[0];
                              }
                            }
                            setFormData({ ...formData, calibration_frequency_months: newFreq, calibrationDue: newDue });
                          }}
                          disabled={isReadOnly}
                          className="h-11"
                        />
                      </div>
                    </div>
                    {formData.calibrationDue && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">{t('tools.nextCalibration')}:</span>{' '}
                          {new Date(`${formData.calibrationDue}T00:00:00`).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="calibrable"
                    checked={formData.isCalibrable}
                    disabled={isReadOnly}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCalibrable: checked as boolean })}
                    className="h-5 w-5"
                  />
                  <div>
                    <Label htmlFor="calibrable" className="cursor-pointer font-semibold">
                      {t('tools.requiresCalibration')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('tools.requiresCalibrationHint')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Attributes Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">{t('tools.customAttributes')}</Label>
                  <Badge variant="outline" className="text-xs">{t('common.optional')}</Badge>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.customAttributes).map(([key, value], index) => (
                    <div
                      key={key}
                      className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg cursor-move hover:bg-muted/40 transition-colors"
                      draggable={!isReadOnly}
                      onDragStart={(e) => !isReadOnly && handleDragStart(e, index)}
                      onDragOver={(e) => !isReadOnly && handleDragOver(e)}
                      onDrop={(e) => !isReadOnly && handleDrop(e, index)}
                    >
                      {!isReadOnly && (
                        <div className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Input value={key} disabled className="font-medium bg-background" />
                        <Input value={value} disabled className="bg-background" />
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomAttribute(key)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {!isReadOnly && (
                    <div className="flex flex-col gap-3 p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <div className="flex gap-3">
                        <Select value={newAttrKeyType} onValueChange={(value) => setNewAttrKeyType(value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('tools.attributeType')} />
                          </SelectTrigger>
                          <SelectContent>
                            {standardAttributes.map(attr => (
                              <SelectItem key={attr} value={attr}>
                                {t(`tools.attrKeys.${attr}`, { defaultValue: attr })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newAttrKeyType === 'Custom' && (
                          <Input
                            placeholder={t('tools.customName')}
                            value={newAttrKey}
                            onChange={(e) => setNewAttrKey(e.target.value)}
                            className="flex-1"
                          />
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Input
                          placeholder={t('tools.attributeValue')}
                          value={newAttrValue}
                          onChange={(e) => setNewAttrValue(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={addCustomAttribute}
                          disabled={!(newAttrKeyType === 'Custom' ? newAttrKey : newAttrKeyType) || !newAttrValue}
                          size="sm"
                          className="px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('tools.toolImage')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('tools.toolImageHint')}
                </p>
              </div>
              <div className={`sticky top-4 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
                <ImageUploadBox
                  value={formData.image}
                  onChange={(value) => setFormData({ ...formData, image: value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6 border-t">
            {isReadOnly ? (
              <Button variant="outline" onClick={closeDialog} className="px-6">
                {t('common.close')}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog} className="px-6">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit} className="px-6">
                  {editingTool ? t('tools.updateTool') : t('tools.addToolBtn')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.deleteToolTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.deleteToolDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Custom Attributes Warning */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.unsavedWarningTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools.unsavedWarningDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tools.goBack')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseDialog}>
              {t('tools.discardAndClose')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
