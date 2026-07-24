import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Megaphone,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import campaignService from '../services/campaignService';

const Campaigns = () => {
  // State management
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null); // null = Create, object = Edit

  // Delete Confirmation State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
    },
  });

  // Fetch campaigns from backend
  const fetchCampaigns = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);
    try {
      const data = await campaignService.getCampaigns();
      // Handle both array responses and DRF paginated responses { results: [] }
      const campaignsList = Array.isArray(data) ? data : data.results || [];
      setCampaigns(campaignsList);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to load campaigns from server.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedCampaign(null);
    reset({
      name: '',
      description: '',
      status: 'active',
    });
    setFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (campaign) => {
    setSelectedCampaign(campaign);
    reset({
      name: campaign.name || '',
      description: campaign.description || '',
      status: campaign.status || 'active',
    });
    setFormOpen(true);
  };

  // Close Form Modal
  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedCampaign(null);
  };

  // Submit Create or Edit Form
  const onSubmitForm = async (formData) => {
    try {
      if (selectedCampaign) {
        // Edit campaign using PUT
        await campaignService.updateCampaign(selectedCampaign.id, formData);
        toast.success(`Campaign "${formData.name}" updated successfully!`);
      } else {
        // Create campaign using POST
        await campaignService.createCampaign(formData);
        toast.success(`Campaign "${formData.name}" created successfully!`);
      }
      handleCloseForm();
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to save campaign:', err);
      const errMsg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Error saving campaign.';
      toast.error(errMsg);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (campaign) => {
    setCampaignToDelete(campaign);
    setDeleteOpen(true);
  };

  // Close Delete Confirmation
  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setCampaignToDelete(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      await campaignService.deleteCampaign(campaignToDelete.id);
      toast.success(`Campaign "${campaignToDelete.name}" deleted successfully.`);
      handleCloseDelete();
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      toast.error('Failed to delete campaign.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered campaigns calculation
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || c.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Display subset for current page
  const paginatedCampaigns = filteredCampaigns.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <PageHeader
        title="Campaign Management"
        subtitle="Create, configure, and monitor automated outreach campaigns"
        actionLabel="Create Campaign"
        actionIcon={Plus}
        onActionClick={handleOpenCreate}
      >
        <Tooltip title="Refresh campaigns list">
          <IconButton
            onClick={() => fetchCampaigns(true)}
            disabled={isRefreshing}
            sx={{
              color: '#9ca3af',
              bgcolor: '#111827',
              border: '1px solid #1f2937',
              '&:hover': { bgcolor: '#1f2937', color: '#ffffff' },
            }}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </PageHeader>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 4,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 3,
            '& .MuiAlert-icon': { color: '#ef4444' },
          }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchCampaigns(true)} sx={{ fontWeight: 700 }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Top Toolbar (Search, Filter, Actions) */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#111827',
          border: '1px solid #1f2937',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <TextField
            placeholder="Search campaigns..."
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#6b7280" />
                </InputAdornment>
              ),
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '240px' },
            }}
          />

          {/* Status Filter */}
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Filter size={16} color="#6b7280" />
                </InputAdornment>
              ),
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '150px' },
            }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </TextField>
        </Box>

        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
          Showing {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Main Data Table */}
      {loading ? (
        <LoadingSpinner message="Loading campaigns..." minHeight="350px" />
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            bgcolor: '#111827',
            border: '1px solid #1f2937',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '1px solid #1f2937', bgcolor: '#0b0f17' }}>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Campaign Name</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Created Date</TableCell>
                  <TableCell align="right" sx={{ color: '#9ca3af', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#6b7280' }}>
                      <Megaphone size={36} color="#374151" style={{ marginBottom: 8 }} />
                      <Typography variant="body1" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                        No campaigns found
                      </Typography>
                      <Typography variant="caption">
                        Try adjusting your search query or status filter.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCampaigns.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{
                        borderBottom: '1px solid #1f2937',
                        transition: 'background-color 0.15s ease',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                      }}
                    >
                      <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>
                        {row.name}
                      </TableCell>
                      <TableCell sx={{ color: '#9ca3af', maxWidth: 300 }} noWrap>
                        {row.description || <span style={{ color: '#4b5563', italic: 'true' }}>No description</span>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status ? row.status.toUpperCase() : 'UNKNOWN'}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            bgcolor:
                              row.status?.toLowerCase() === 'active'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : row.status?.toLowerCase() === 'inactive'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(107, 114, 128, 0.15)',
                            color:
                              row.status?.toLowerCase() === 'active'
                                ? '#10b981'
                                : row.status?.toLowerCase() === 'inactive'
                                ? '#f59e0b'
                                : '#9ca3af',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Campaign">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(row)}
                            sx={{ color: '#818cf8', mr: 1, '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' } }}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Campaign">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDelete(row)}
                            sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCampaigns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: '#9ca3af',
              borderTop: '1px solid #1f2937',
              '& .MuiTablePagination-selectIcon': { color: '#9ca3af' },
            }}
          />
        </Paper>
      )}

      {/* Create / Edit Campaign Modal */}
      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#111827',
            color: '#f3f4f6',
            borderRadius: 3,
            border: '1px solid #1f2937',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ffffff', borderBottom: '1px solid #1f2937', pb: 2 }}>
          {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={2.5}>
              {/* Campaign Name */}
              <Box>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Campaign Name <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Campaign Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. SaaS Founders Outbound Q3"
                      error={Boolean(errors.name)}
                      helperText={errors.name?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Box>

              {/* Description */}
              <Box>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Description
                </Typography>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Brief overview of campaign targets and objectives..."
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Box>

              {/* Status */}
              <Box>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Status
                </Typography>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                    </TextField>
                  )}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #1f2937', pt: 2, px: 3, pb: 2 }}>
            <Button onClick={handleCloseForm} sx={{ color: '#9ca3af', textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                bgcolor: '#6366f1',
                color: '#ffffff',
                fontWeight: 700,
                px: 3,
                py: 1,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              {selectedCampaign ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#111827',
            color: '#f3f4f6',
            borderRadius: 3,
            border: '1px solid #1f2937',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle color="#ef4444" size={22} /> Delete Campaign
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Are you sure you want to delete campaign <strong>"{campaignToDelete?.name}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDelete} sx={{ color: '#9ca3af', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={isDeleting}
            sx={{
              bgcolor: '#ef4444',
              color: '#ffffff',
              fontWeight: 700,
              px: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#dc2626' },
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Campaigns;
