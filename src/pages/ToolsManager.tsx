import React, { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
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
import { useAppData, Tool } from '@/contexts/AppDataContext';
import { matchesSearch } from '@/lib/search';
import { getUploadUrl } from '@/lib/api';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { exportToolsToExcel, categoryKeyMap, statusKeyMap } from '@/lib/exportTools';
import { ToolStatusBadges } from '@/components/ToolStatusBadges';

// ─── Constants ────────────────────────────────────────────────────────────────

const categories = ['Electrical', 'Mechanical', 'Safety', 'Measurement', 'Hand Tools', 'Power Tools', 'Cleaning and Maintenance', 'Workstation Equipment'];
const statuses: (Tool['status'] | 'Missing')[] = ['Available', 'In Use', 'Damaged', 'Lost', 'Missing', 'Cal. Due'];
const standardAttributes = ['Brand', 'Model', 'Serial Number', 'Custom'];

const attributeKeyNormalization: Record<string, string> = {
  'Marca': 'Brand', 'marca': 'Brand',
  'Modelo': 'Model', 'modelo': 'Model',
  'N° de Serie': 'Serial Number', 'Serie': 'Serial Number',
  'serie': 'Serial Number', 'serial_number': 'Serial Number',
  'Personalizado': 'Custom', 'personalizado': 'Custom',
};

type ExtendedTool = Tool & Partial<{ certificateNumber: string; quantity: number }>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ToolsManager() {
  const { tools, addTool, updateTool, deleteTool, assignments } = useAppData();
  const { t } = useTranslation();

  const tAttrKey = (key: string) => {
    const normalizedKey = attributeKeyNormalization[key] || key;
    return t(`tools.attrKeys.${normalizedKey}`, { defaultValue: normalizedKey });
  };
  const translateCategory = (category: string) =>
    categoryKeyMap[category]
      ? t(`tools.categories.${categoryKeyMap[category]}`, { defaultValue: category })
      : category;
  const translateStatus = (status: string) =>
    statusKeyMap[status]
      ? t(`tools.statusLabels.${statusKeyMap[status]}`, { defaultValue: status })
      : status;

  // ─── State ──────────────────────────────────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [sortField, setSortField] = useState<'name' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedSearch = window.localStorage.getItem('toolSearchTerm');
    if (storedSearch) { setSearchQuery(storedSearch); window.localStorage.removeItem('toolSearchTerm'); }
    const storedStatus = window.localStorage.getItem('toolStatusFilter');
    if (storedStatus) { setStatusFilter(storedStatus); window.localStorage.removeItem('toolStatusFilter'); }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'f') { event.preventDefault(); searchInputRef.current?.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Derived state ────────────────────────────────────────────────────────────
  const isReadOnly = statusFilter !== 'All' && statusFilter !== 'Available';

  const handleSort = (field: 'name') => {
    if (sortField === field) {
      if (sortDirection === 'asc') { setSortDirection('desc'); }
      else { setSortField(null); setSortDirection('asc'); }
    } else { setSortField(field); setSortDirection('asc'); }
  };

  const getSortIcon = (field: 'name') => {
    if (sortField !== field) return ArrowUpDown;
    return sortDirection === 'asc' ? ArrowUp : ArrowDown;
  };

  const filteredTools = tools
    .filter(tool => {
      const extTool = tool as ExtendedTool;
      const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
      let matchesStatus = false;
      if (statusFilter === 'All') {
        matchesStatus = true;
      } else if (statusFilter === 'Damaged') {
        const hasDamagedInAsg = assignments.some(asg => {
          const cond = asg.toolConditions?.[tool.id];
          return cond && (typeof cond === 'object' ? Number(cond.damaged) > 0 : cond === 'damaged');
        });
        matchesStatus = tool.status === 'Damaged' || ((tool.damagedQuantity || 0) > 0) || hasDamagedInAsg;
      } else if (statusFilter === 'Lost') {
        const hasLostInAsg = assignments.some(asg => {
          const cond = asg.toolConditions?.[tool.id];
          return cond && (typeof cond === 'object' ? Number(cond.lost) > 0 : cond === 'lost');
        });
        matchesStatus = tool.status === 'Lost' || ((tool.lostQuantity || 0) > 0) || hasLostInAsg;
      } else if (statusFilter === 'Available') {
        matchesStatus = tool.status === 'Available' || ((extTool.availableQuantity || 0) > 0);
      } else if (statusFilter === 'Missing') {
        matchesStatus = assignments.some(asg => {
          if (asg.status !== 'completed' || !asg.toolConditions) return false;
          const cond = asg.toolConditions[tool.id];
          if (!cond) return false;
          if (typeof cond === 'object') return Number(cond.missing) > 0;
          return cond === 'missing';
        });
      } else if (statusFilter === 'Cal. Due') {
        if (tool.status === 'Cal. Due') { matchesStatus = true; }
        else if (tool.isCalibrable && tool.calibrationDue) {
          const dueDate = new Date(tool.calibrationDue);
          const today = new Date(); today.setHours(0, 0, 0, 0); dueDate.setHours(0, 0, 0, 0);
          const thirtyDaysFromNow = new Date(today); thirtyDaysFromNow.setDate(today.getDate() + 30);
          matchesStatus = dueDate <= thirtyDaysFromNow;
        }
      } else if (statusFilter === 'In Use') {
        matchesStatus = tool.status === 'In Use' || ((extTool.inUseQuantity || 0) > 0);
      } else {
        matchesStatus = tool.status === statusFilter;
      }
      return matchesCategory && matchesStatus && matchesSearch(tool.name, searchQuery);
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let aVal = a[sortField] as string; let bVal = b[sortField] as string;
      aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // ─── Dialog helpers ───────────────────────────────────────────────────────────
  const openDialog = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      const t2 = tool as Tool & Partial<{ certificateNumber: string; inUseQuantity: number; damagedQuantity: number; lostQuantity: number; missingQuantity: number }>;
      let displayQty = t2.quantity || 1;
      if (isReadOnly) {
        if (statusFilter === 'In Use') displayQty = t2.inUseQuantity || 0;
        else if (statusFilter === 'Damaged') displayQty = t2.damagedQuantity || 0;
        else if (statusFilter === 'Lost') displayQty = t2.lostQuantity || 0;
        else if (statusFilter === 'Missing') displayQty = t2.missingQuantity || 0;
      }
      setFormData({
        name: tool.name, category: tool.category, status: tool.status,
        isCalibrable: tool.isCalibrable, calibrationDue: tool.calibrationDue || '',
        certificateNumber: t2.certificateNumber || '', quantity: displayQty,
        image: tool.image || null, customAttributes: { ...tool.customAttributes },
        calibration_company: tool.calibration_company || '',
        last_calibration_date: tool.last_calibration_date || '',
        calibration_frequency_months: tool.calibration_frequency_months ?? 12,
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: '', category: '', status: 'Available', isCalibrable: false,
        calibrationDue: '', certificateNumber: '', quantity: 1, image: null,
        customAttributes: {}, calibration_company: '', last_calibration_date: '',
        calibration_frequency_months: 12,
      });
    }
    setNewAttrKeyType('Brand'); setNewAttrKey(''); setNewAttrValue('');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (newAttrValue.trim() || (newAttrKeyType === 'Custom' && newAttrKey.trim())) {
      setShowUnsavedWarning(true); return;
    }
    setIsDialogOpen(false);
    setNewAttrKeyType('Brand'); setNewAttrKey(''); setNewAttrValue('');
  };

  const confirmCloseDialog = () => {
    setShowUnsavedWarning(false); setIsDialogOpen(false);
    setNewAttrKeyType('Brand'); setNewAttrKey(''); setNewAttrValue('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) { toast.error(t('tools.requiredFields')); return; }
    if (newAttrValue.trim() || (newAttrKeyType === 'Custom' && newAttrKey.trim())) {
      toast.error(t('tools.unsavedAttributeWarning')); return;
    }
    try {
      if (editingTool) { await updateTool(editingTool.id, { ...formData }); toast.success(t('tools.updateSuccess')); }
      else { await addTool({ ...formData }); toast.success(t('tools.addSuccess')); }
      setIsDialogOpen(false); setNewAttrKey(''); setNewAttrValue('');
    } catch (error) { toast.error(t('tools.saveFailed')); console.error('Error saving tool:', error); }
  };

  const handleDeleteAttempt = (id: number) => {
    const assigned = assignments.some(a => a.status === 'active' && a.tools.some(t2 => t2.id === id));
    if (assigned) { toast.error(t('tools.cannotDeleteAssigned')); return; }
    setDeleteConfirmId(id);
  };

  const handleDelete = async (id: number) => {
    try { await deleteTool(id); toast.success(t('tools.deleteSuccess')); setDeleteConfirmId(null); }
    catch (error) { toast.error(t('tools.deleteFailed')); console.error('Error deleting tool:', error); }
  };

  // ─── Custom attribute helpers ─────────────────────────────────────────────────
  const addCustomAttribute = () => {
    const keyToUse = newAttrKeyType === 'Custom' ? newAttrKey : newAttrKeyType;
    if (keyToUse && newAttrValue) {
      setFormData({ ...formData, customAttributes: { ...formData.customAttributes, [keyToUse]: newAttrValue } });
      setNewAttrKeyType('Brand'); setNewAttrKey(''); setNewAttrValue('');
    }
  };

  const removeCustomAttribute = (key: string) => {
    const newAttrs = { ...formData.customAttributes };
    delete newAttrs[key];
    setFormData({ ...formData, customAttributes: newAttrs });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedAttrIndex(index); e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedAttrIndex === null || draggedAttrIndex === dropIndex) return;
    const entries = Object.entries(formData.customAttributes);
    const [dragged] = entries.splice(draggedAttrIndex, 1);
    entries.splice(dropIndex, 0, dragged);
    setFormData({ ...formData, customAttributes: Object.fromEntries(entries) });
    setDraggedAttrIndex(null);
  };

  // ─── Calibration badge ────────────────────────────────────────────────────────
  const renderCalibrationStatus = (tool: Tool) => {
    if (!tool.isCalibrable || !tool.calibrationDue) return null;
    const dueDate = new Date(tool.calibrationDue);
    const today = new Date(); today.setHours(0, 0, 0, 0); dueDate.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today); thirtyDaysFromNow.setDate(today.getDate() + 30);
    let state = 'ok';
    if (dueDate < today) state = 'overdue';
    else if (dueDate <= thirtyDaysFromNow) state = 'soon';
    let style = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200/60 dark:border-green-700/40';
    let Icon = CheckCircle;
    if (state === 'overdue') { style = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200/60 dark:border-red-700/40'; Icon = AlertTriangle; }
    else if (state === 'soon') { style = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200/60 dark:border-yellow-700/40'; Icon = AlertTriangle; }
    return (
      <div className="mt-3 mb-2">
        <Badge variant="outline" className={`flex w-fit items-center gap-1.5 ${style}`}>
          <Icon className="h-3 w-3" />
          <span>{t('tools.calDueLabel')}: {dueDate.toLocaleDateString()}</span>
        </Badge>
      </div>
    );
  };

  // ─── Export ───────────────────────────────────────────────────────────────────
  const handleExportExcel = () => exportToolsToExcel({
    filteredTools, assignments, statusFilter,
    translateCategory, translateStatus,
    onSuccess: () => toast.success(t('tools.exportSuccess')),
    onError: () => toast.error(t('tools.exportFailed')),
  });

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('common.view')}:</span>
            <div className="flex items-center border rounded-lg p-1">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 px-3">
                <LayoutGrid className="h-4 w-4 mr-1" />{t('common.grid')}
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 px-3">
                <List className="h-4 w-4 mr-1" />{t('common.list')}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('common.sort')}:</span>
            {(() => {
              const Icon = getSortIcon('name'); return (
                <Button variant={sortField === 'name' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('name')} className="h-8 px-3">
                  <Icon className="h-4 w-4 mr-1" />{t('common.name')}
                </Button>
              );
            })()}
          </div>
        </div>
        {viewMode === 'grid' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('common.columns')}:</span>
            <div className="flex items-center border rounded-lg p-1">
              {([2, 3, 4] as const).map(cols => (
                <Button key={cols} variant={gridColumns === cols ? 'default' : 'ghost'} size="sm"
                  onClick={() => setGridColumns(cols)} className="h-8 w-8 p-0">{cols}</Button>
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
        <div className={[
          'grid gap-4',
          gridColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
            gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        ].join(' ')}>
          {filteredTools.map(tool => (
            <Card key={tool.id} className="hover:shadow-lg transition-all hover:scale-105 flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <div className="aspect-square mb-4 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {tool.image
                    ? <img src={getUploadUrl(tool.image as string)} alt={tool.name} className="w-full h-full object-cover" />
                    : <span className="text-6xl">🔧</span>}
                </div>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">
                    {t(`tools.categories.${categoryKeyMap[tool.category]}`, { defaultValue: tool.category })}
                  </Badge>
                  <ToolStatusBadges tool={tool} assignments={assignments} statusFilter={statusFilter} />
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
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openDialog(tool)} className="flex-1">
                    <Pencil className="mr-2 h-4 w-4" />{t('common.edit')}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAttempt(tool.id)}>
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
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {tool.image
                      ? <img src={getUploadUrl(tool.image as string)} alt={tool.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">🔧</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{tool.name}</h3>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="outline">
                            {t(`tools.categories.${categoryKeyMap[tool.category]}`, { defaultValue: tool.category })}
                          </Badge>
                          <ToolStatusBadges tool={tool} assignments={assignments} statusFilter={statusFilter} />
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => openDialog(tool)}>
                          <Pencil className="h-4 w-4 mr-1" />{t('common.edit')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAttempt(tool.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {Object.entries(tool.customAttributes).length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        {Object.entries(tool.customAttributes).map(([key, value]) => (
                          <span key={key}><span className="font-medium">{tAttrKey(key)}:</span> {value}</span>
                        ))}
                      </div>
                    )}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl">{editingTool ? t('tools.editTool') : t('tools.addTool')}</DialogTitle>
            <DialogDescription className="text-base">
              {editingTool ? t('tools.editToolDesc') : t('tools.addToolDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('tools.toolName')}</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('tools.toolNamePlaceholder')} disabled={isReadOnly} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('tools.categoryRequired')}</Label>
                    <Select disabled={isReadOnly} value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="h-11"><SelectValue placeholder={t('tools.selectCategory')} /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{t(`tools.categories.${categoryKeyMap[cat]}`, { defaultValue: cat })}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('common.status')}</Label>
                    <Select disabled={isReadOnly} value={formData.status} onValueChange={(value: Tool['status']) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>{t(`tools.statusLabels.${status}`, { defaultValue: status })}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">{t('common.quantity')}</Label>
                    <Input type="number" min={1} value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) || 1 })}
                      disabled={isReadOnly} className="h-11 w-full max-w-xs" />
                    <p className="text-xs text-muted-foreground">{t('tools.quantityHint')}</p>
                  </div>
                </div>

                {formData.isCalibrable && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.certifyingCompany')}</Label>
                        <Input value={formData.calibration_company}
                          onChange={(e) => setFormData({ ...formData, calibration_company: e.target.value })}
                          disabled={isReadOnly} placeholder={t('tools.certifyingCompanyPlaceholder')} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.certificateNumber')}</Label>
                        <Input value={formData.certificateNumber}
                          onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                          disabled={isReadOnly} placeholder={t('tools.certificateNumberPlaceholder')} className="h-11" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.lastCalibration')}</Label>
                        <Input type="date" value={formData.last_calibration_date}
                          onChange={(e) => {
                            const newLastDate = e.target.value;
                            let newDue = formData.calibrationDue;
                            if (newLastDate && formData.calibration_frequency_months) {
                              const d = new Date(newLastDate);
                              if (!isNaN(d.getTime())) { d.setMonth(d.getMonth() + Number(formData.calibration_frequency_months)); newDue = d.toISOString().split('T')[0]; }
                            }
                            setFormData({ ...formData, last_calibration_date: newLastDate, calibrationDue: newDue });
                          }}
                          disabled={isReadOnly} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{t('tools.frequencyMonths')}</Label>
                        <Input type="number" min={1} value={formData.calibration_frequency_months}
                          onChange={(e) => {
                            const newFreq = Number(e.target.value) || 12;
                            let newDue = formData.calibrationDue;
                            if (formData.last_calibration_date) {
                              const d = new Date(formData.last_calibration_date);
                              if (!isNaN(d.getTime())) { d.setMonth(d.getMonth() + newFreq); newDue = d.toISOString().split('T')[0]; }
                            }
                            setFormData({ ...formData, calibration_frequency_months: newFreq, calibrationDue: newDue });
                          }}
                          disabled={isReadOnly} className="h-11" />
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
                  <Checkbox id="calibrable" checked={formData.isCalibrable} disabled={isReadOnly}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCalibrable: checked as boolean })}
                    className="h-5 w-5" />
                  <div>
                    <Label htmlFor="calibrable" className="cursor-pointer font-semibold">{t('tools.requiresCalibration')}</Label>
                    <p className="text-sm text-muted-foreground">{t('tools.requiresCalibrationHint')}</p>
                  </div>
                </div>
              </div>

              {/* Custom Attributes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">{t('tools.customAttributes')}</Label>
                  <Badge variant="outline" className="text-xs">{t('common.optional')}</Badge>
                </div>
                <div className="space-y-3">
                  {Object.entries(formData.customAttributes).map(([key, value], index) => (
                    <div key={key} className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg cursor-move hover:bg-muted/40 transition-colors"
                      draggable={!isReadOnly}
                      onDragStart={(e) => !isReadOnly && handleDragStart(e, index)}
                      onDragOver={(e) => !isReadOnly && handleDragOver(e)}
                      onDrop={(e) => !isReadOnly && handleDrop(e, index)}>
                      {!isReadOnly && (
                        <div className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Input value={tAttrKey(key)} disabled className="font-medium bg-background" />
                        <Input value={value} disabled className="bg-background" />
                      </div>
                      {!isReadOnly && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomAttribute(key)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <div className="flex flex-col gap-3 p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                      <div className="flex gap-3">
                        <Select value={newAttrKeyType} onValueChange={setNewAttrKeyType}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('tools.attributeType')} />
                          </SelectTrigger>
                          <SelectContent>
                            {standardAttributes.map(attr => (
                              <SelectItem key={attr} value={attr}>{t(`tools.attrKeys.${attr}`, { defaultValue: attr })}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newAttrKeyType === 'Custom' && (
                          <Input placeholder={t('tools.customName')} value={newAttrKey} onChange={(e) => setNewAttrKey(e.target.value)} className="flex-1" />
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Input placeholder={t('tools.attributeValue')} value={newAttrValue}
                          onChange={(e) => setNewAttrValue(e.target.value)} className="flex-1" />
                        <Button type="button" onClick={addCustomAttribute}
                          disabled={!(newAttrKeyType === 'Custom' ? newAttrKey : newAttrKeyType) || !newAttrValue}
                          size="sm" className="px-3">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('tools.toolImage')}</Label>
                <p className="text-xs text-muted-foreground">{t('tools.toolImageHint')}</p>
              </div>
              <div className={`sticky top-4 ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`}>
                <ImageUploadBox value={formData.image} onChange={(value) => setFormData({ ...formData, image: value })} className="w-full" />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t">
            {isReadOnly ? (
              <Button variant="outline" onClick={closeDialog} className="px-6">{t('common.close')}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog} className="px-6">{t('common.cancel')}</Button>
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
            <AlertDialogDescription>{t('tools.deleteToolDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Attributes Warning */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tools.unsavedWarningTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('tools.unsavedWarningDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tools.goBack')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseDialog}>{t('tools.discardAndClose')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
