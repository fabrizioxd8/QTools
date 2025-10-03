import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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

  const filteredTools = tools.filter(tool => {
    const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || tool.status === statusFilter;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
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

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingTool) {
      updateTool(editingTool.id, formData);
      toast.success('Tool updated successfully');
    } else {
      addTool(formData);
      toast.success('Tool added successfully');
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteTool(id);
    toast.success('Tool deleted successfully');
    setDeleteConfirmId(null);
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

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No tools found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map(tool => (
            <Card key={tool.id} className="hover:shadow-lg transition-all hover:scale-105">
              <CardHeader>
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
              <CardContent>
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
                
                <div className="flex gap-2">
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
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{editingTool ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
            <DialogDescription>
              {editingTool ? 'Update tool information' : 'Add a new tool to your inventory'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tool Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter tool name"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: Tool['status']) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="calibrable"
                checked={formData.isCalibrable}
                onCheckedChange={(checked) => setFormData({ ...formData, isCalibrable: checked as boolean })}
              />
              <Label htmlFor="calibrable" className="cursor-pointer">Is Calibrable?</Label>
            </div>
            
            {formData.isCalibrable && (
              <div className="space-y-2">
                <Label>Calibration Due Date</Label>
                <Input
                  type="date"
                  value={formData.calibrationDue}
                  onChange={(e) => setFormData({ ...formData, calibrationDue: e.target.value })}
                />
              </div>
            )}
            
              </div>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                <Label>Tool Image</Label>
                <ImageUploadBox
                  value={formData.image}
                  onChange={(value) => setFormData({ ...formData, image: value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Custom Attributes</Label>
              <div className="space-y-2">
                {Object.entries(formData.customAttributes).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <Input value={key} disabled className="flex-1" />
                    <Input value={value} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCustomAttribute(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={newAttrKey}
                    onChange={(e) => setNewAttrKey(e.target.value)}
                  />
                  <Input
                    placeholder="Value"
                    value={newAttrValue}
                    onChange={(e) => setNewAttrValue(e.target.value)}
                  />
                  <Button type="button" onClick={addCustomAttribute}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingTool ? 'Update' : 'Add'} Tool
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
