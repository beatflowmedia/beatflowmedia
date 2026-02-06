import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  CheckCircle,
  CloudUpload,
  Link as LinkIcon,
  Delete
} from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function StudioProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState(false);

  // Form state for new/edit project
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    projectType: '',
    description: '',
    status: 'in_progress',
    price: '',
    deliveryDate: '',
    deliverables: '',
    notes: ''
  });

  // Load projects with real-time updates
  useEffect(() => {
    const projectsQuery = query(
      collection(db, 'studioProjects'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projectsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsList);
      setLoading(false);
    }, (error) => {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddProject = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      projectType: '',
      description: '',
      status: 'in_progress',
      price: '',
      deliveryDate: '',
      deliverables: '',
      notes: ''
    });
    setAddDialogOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setFormData({
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      projectType: project.projectType || '',
      description: project.description || '',
      status: project.status || 'in_progress',
      price: project.price || '',
      deliveryDate: project.deliveryDate || '',
      deliverables: project.deliverables || '',
      notes: project.notes || ''
    });
    setDialogOpen(true);
  };

  const handleSubmitNewProject = async () => {
    if (!formData.clientName || !formData.projectType) {
      toast.error('Client name and project type are required');
      return;
    }

    setProcessing(true);
    try {
      await addDoc(collection(db, 'studioProjects'), {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Project added successfully');
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    setProcessing(true);
    try {
      const projectRef = doc(db, 'studioProjects', selectedProject.id);
      await updateDoc(projectRef, {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        updatedAt: serverTimestamp()
      });

      toast.success('Project updated successfully');
      setDialogOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsDelivered = async (project) => {
    if (window.confirm(`Mark project for ${project.clientName} as delivered?`)) {
      try {
        const projectRef = doc(db, 'studioProjects', project.id);
        await updateDoc(projectRef, {
          status: 'delivered',
          deliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Project marked as delivered');
      } catch (error) {
        console.error('Error marking project as delivered:', error);
        toast.error('Failed to update project status');
      }
    }
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm(`Delete project for ${project.clientName}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'studioProjects', project.id));
        toast.success('Project deleted successfully');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const handleGenerateDownloadLink = (project) => {
    // Placeholder for download link generation
    // In production, this would generate a secure Firebase Storage link
    const linkText = `${window.location.origin}/studio/download/${project.id}`;
    navigator.clipboard.writeText(linkText);
    toast.success('Download link copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'warning';
      case 'revision': return 'info';
      case 'delivered': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'revision': return 'Revision';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };


  // Filter projects
  const filteredProjects = statusFilter === 'all'
    ? projects
    : projects.filter(proj => proj.status === statusFilter);

  // Count by status
  const inProgressCount = projects.filter(p => p.status === 'in_progress').length;
  const revisionCount = projects.filter(p => p.status === 'revision').length;
  const deliveredCount = projects.filter(p => p.status === 'delivered').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Studio Projects
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAddProject}
          >
            New Project
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Track and manage client projects for BeatFlow Studio
        </Typography>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Alert severity="warning" sx={{ flex: 1 }}>
            {inProgressCount} in progress
          </Alert>
          <Alert severity="info" sx={{ flex: 1 }}>
            {revisionCount} in revision
          </Alert>
          <Alert severity="success" sx={{ flex: 1 }}>
            {deliveredCount} delivered
          </Alert>
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={statusFilter} onChange={(e, newValue) => setStatusFilter(newValue)}>
          <Tab label={`All (${projects.length})`} value="all" />
          <Tab label={`In Progress (${inProgressCount})`} value="in_progress" />
          <Tab label={`Revision (${revisionCount})`} value="revision" />
          <Tab label={`Delivered (${deliveredCount})`} value="delivered" />
        </Tabs>
      </Box>

      {/* Projects Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Project Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Delivery Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading projects...
                </TableCell>
              </TableRow>
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No projects found
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={handleAddProject}
                      sx={{ mt: 2 }}
                    >
                      Add Your First Project
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {project.clientName}
                    </Typography>
                    {project.clientEmail && (
                      <Typography variant="caption" color="text.secondary">
                        {project.clientEmail}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {project.projectType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(project.status)}
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      ${project.price?.toFixed(2) || '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {project.deliveryDate || 'Not set'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Edit Project">
                        <IconButton
                          size="small"
                          onClick={() => handleEditProject(project)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      {project.status !== 'delivered' && (
                        <Tooltip title="Mark as Delivered">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsDelivered(project)}
                            color="success"
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Generate Download Link">
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateDownloadLink(project)}
                          color="info"
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Project Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => !processing && setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Client Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client Email"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Project Type"
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  placeholder="e.g., Audio Kit, Mood Library, Custom Composition"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="revision">Revision</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Date"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project description and requirements..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Deliverables"
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                  placeholder="List of deliverables (e.g., 10 tracks, stems, master files)..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Internal Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Private notes for internal tracking..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitNewProject}
            disabled={processing || !formData.clientName || !formData.projectType}
            variant="contained"
            color="primary"
          >
            {processing ? 'Adding...' : 'Add Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Client Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client Email"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Project Type"
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="revision">Revision</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Delivery Date"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Deliverables"
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Internal Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>

              {/* Deliverables Upload Section (Placeholder) */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Deliverables Upload
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  File upload integration with Firebase Storage can be added here. For now, use external file sharing services.
                </Alert>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  disabled
                  fullWidth
                >
                  Upload Files (Coming Soon)
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => selectedProject && handleDeleteProject(selectedProject)}
            disabled={processing}
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProject}
            disabled={processing || !formData.clientName || !formData.projectType}
            variant="contained"
            color="primary"
          >
            {processing ? 'Updating...' : 'Update Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
