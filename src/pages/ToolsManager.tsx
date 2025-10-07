import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Grid3X3, List, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

const categories = ['Electrical', 'Mechanical', 'Safety', 'Measurement', 'Hand Tools', 'Power Tools'];
const statuses: Tool['status'][] = ['Available', 'In Use', 'Damaged', 'Lost', 'Cal. Due'];

export default function ToolsManager() {
  const { tools, addTool, updateTool, deleteTool } = useAppData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
    image: '',
    customAttributes: {} as Record<string, string>,
  });

  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools
    .filter(tool => {
      const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || tool.status === statusFilter;
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStatus && matchesSearch;
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
      setFormData({
        name: tool.name,
        category: tool.category,
        status: tool.status,
        isCalibrable: tool.isCalibrable,
        calibrationDue: tool.calibrationDue || '',
        image: tool.image || '',
        customAttributes: { ...tool.customAttributes },
      });
    } else {
      setEditingTool(null);
      setFormData({
        name: '',
        category: '',
        status: 'Available',
        isCalibrable: false,
        calibrationDue: '',
        image: '',
        customAttributes: {},
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingTool) {
        await updateTool(editingTool.id, formData);
        toast.success('Tool updated successfully');
      } else {
        await addTool(formData);
        toast.success('Tool added successfully');
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save tool. Please try again.');
      console.error('Error saving tool:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTool(id);
      toast.success('Tool deleted successfully');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error('Failed to delete tool. Please try again.');
      console.error('Error deleting tool:', error);
    }
  };

  const addCustomAttribute = () => {
    if (newAttrKey && newAttrValue) {
      setFormData({
        ...formData,
        customAttributes: {
          ...formData.customAttributes,
          [newAttrKey]: newAttrValue,
        },
      });
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  const removeCustomAttribute = (key: string) => {
    const newAttrs = { ...formData.customAttributes };
    delete newAttrs[key];
    setFormData({ ...formData, customAttributes: newAttrs });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tools Manager</h1>
          <p className="text-muted-foreground">Manage your tool inventory</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Tool
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
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
            <span className="text-sm font-medium">View:</span>
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort:</span>
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
                    Name
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>

        {viewMode === 'grid' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Columns:</span>
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
            <p className="text-center text-muted-foreground">No tools found</p>
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
                    <img src={tool.image} alt={tool.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">🔧</span>
                  )}
                </div>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{tool.category}</Badge>
                  <Badge variant={getStatusBadgeVariant(tool.status)}>{tool.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  {Object.entries(tool.customAttributes).length > 0 && (
                    <div className="space-y-1 mb-4">
                      {Object.entries(tool.customAttributes).map(([key, value]) => (
                        <p key={key} className="text-sm text-muted-foreground">
                          <span className="font-medium">{key}:</span> {value}
                        </p>
                      ))}
                    </div>
                  )}

                  {tool.isCalibrable && tool.calibrationDue && (
                    <p className="text-sm text-muted-foreground mb-4">
                      <span className="font-medium">Cal. Due:</span> {new Date(tool.calibrationDue).toLocaleDateString()}
                    </p>
                  )}
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
                    onClick={() => setDeleteConfirmId(tool.id)}
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
                      <img src={tool.image} alt={tool.name} className="w-full h-full object-cover" />
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
                          <Badge variant={getStatusBadgeVariant(tool.status)}>{tool.status}</Badge>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => openDialog(tool)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirmId(tool.id)}
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
                            <span className="font-medium">{key}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Calibration Info */}
                    {tool.isCalibrable && tool.calibrationDue && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Cal. Due:</span> {new Date(tool.calibrationDue).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl">{editingTool ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
            <DialogDescription className="text-base">
              {editingTool ? 'Update tool information and settings' : 'Add a new tool to your inventory with all necessary details'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tool Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Digital Multimeter"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Status</Label>
                    <Select value={formData.status} onValueChange={(value: Tool['status']) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.isCalibrable && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Calibration Due Date</Label>
                      <Input
                        type="date"
                        value={formData.calibrationDue}
                        onChange={(e) => setFormData({ ...formData, calibrationDue: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="calibrable"
                    checked={formData.isCalibrable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCalibrable: checked as boolean })}
                    className="h-5 w-5"
                  />
                  <div>
                    <Label htmlFor="calibrable" className="cursor-pointer font-semibold">
                      Requires Calibration
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Check if this tool needs regular calibration
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Attributes Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Custom Attributes</Label>
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.customAttributes).map(([key, value]) => (
                    <div key={key} className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Input value={key} disabled className="font-medium bg-background" />
                        <Input value={value} disabled className="bg-background" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomAttribute(key)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-3 p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <Input
                      placeholder="Attribute name (e.g., Brand)"
                      value={newAttrKey}
                      onChange={(e) => setNewAttrKey(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (e.g., Fluke)"
                      value={newAttrValue}
                      onChange={(e) => setNewAttrValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCustomAttribute}
                      disabled={!newAttrKey || !newAttrValue}
                      size="sm"
                      className="px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tool Image</Label>
                <p className="text-xs text-muted-foreground">
                  Add a photo to help identify this tool
                </p>
              </div>
              <div className="sticky top-4">
                <ImageUploadBox
                  value={formData.image}
                  onChange={(value) => setFormData({ ...formData, image: value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="px-6">
              {editingTool ? 'Update Tool' : 'Add Tool'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tool from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
