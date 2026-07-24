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
  Grid,
} from '@mui/material';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Target,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import icpService from '../services/icpService';
import campaignService from '../services/campaignService';

// Helper to parse extended metadata stored in keywords or string fields
const parseExtendedFields = (icp) => {
  let location = icp.location || '';
  let job_title = icp.job_title || '';
  let pain_points = icp.pain_points || '';
  let technologies = icp.technologies || '';
  let rawKeywords = icp.keywords || '';

  // Try parsing from JSON keywords if present
  if (rawKeywords.startsWith('{') && rawKeywords.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawKeywords);
      location = parsed.location || location;
      job_title = parsed.job_title || job_title;
      pain_points = parsed.pain_points || pain_points;
      technologies = parsed.technologies || technologies;
      rawKeywords = parsed.keywords || rawKeywords;
    } catch (e) {
      // Fallback to plain string parsing if not valid JSON
    }
  }

  return {
    location: location || 'United States',
    job_title: job_title || 'VP of Sales / Head of Growth',
    pain_points: pain_points || 'Low pipeline velocity, manual prospecting',
    technologies: technologies || 'Salesforce, HubSpot, Outreach',
    keywords: rawKeywords,
  };
};

const ICP = () => {
  // State management
  const [icps, setIcps] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('ALL');
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState('ALL');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedICP, setSelectedICP] = useState(null); // null = Create, object = Edit

  // Delete Confirmation State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [icpToDelete, setIcpToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      campaign: '',
      industry: '',
      company_size: '',
      location: '',
      job_title: '',
      pain_points: '',
      keywords: '',
      technologies: '',
    },
  });

  // Fetch ICPs and Campaigns from backend
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);
    try {
      const [icpData, campaignData] = await Promise.all([
        icpService.getICPs(),
        campaignService.getCampaigns(),
      ]);

      const icpList = Array.isArray(icpData) ? icpData : icpData.results || [];
      const campaignList = Array.isArray(campaignData) ? campaignData : campaignData.results || [];

      setIcps(icpList);
      setCampaigns(campaignList);
    } catch (err) {
      console.error('Failed to fetch ICP data:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to load ICP records from server.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedICP(null);
    reset({
      campaign: campaigns.length > 0 ? campaigns[0].id : '',
      industry: '',
      company_size: '50-250 employees',
      location: 'United States',
      job_title: 'VP of Sales / Head of Growth',
      pain_points: '',
      keywords: '',
      technologies: '',
    });
    setFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (icp) => {
    setSelectedICP(icp);
    const parsed = parseExtendedFields(icp);
    const campaignId = typeof icp.campaign === 'object' ? icp.campaign?.id : icp.campaign;

    reset({
      campaign: campaignId || '',
      industry: icp.industry || '',
      company_size: icp.company_size || '',
      location: parsed.location,
      job_title: parsed.job_title,
      pain_points: parsed.pain_points,
      keywords: parsed.keywords,
      technologies: parsed.technologies,
    });
    setFormOpen(true);
  };

  // Close Form Modal
  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedICP(null);
  };

  // Submit Create or Edit Form
  const onSubmitForm = async (formData) => {
    try {
      // Pack extended fields cleanly into keywords payload for Django model compliance
      const payloadKeywords = JSON.stringify({
        keywords: formData.keywords,
        location: formData.location,
        job_title: formData.job_title,
        pain_points: formData.pain_points,
        technologies: formData.technologies,
      });

      const payload = {
        campaign: Number(formData.campaign),
        industry: formData.industry,
        company_size: formData.company_size,
        keywords: payloadKeywords,
      };

      if (selectedICP) {
        // Edit ICP using PUT
        await icpService.updateICP(selectedICP.id, payload);
        toast.success(`ICP profile for "${formData.industry}" updated successfully!`);
      } else {
        // Create ICP using POST
        await icpService.createICP(payload);
        toast.success(`ICP profile for "${formData.industry}" created successfully!`);
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      console.error('Failed to save ICP profile:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.campaign?.[0] || 'Error saving ICP profile.';
      toast.error(errMsg);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (icp) => {
    setIcpToDelete(icp);
    setDeleteOpen(true);
  };

  // Close Delete Confirmation
  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setIcpToDelete(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!icpToDelete) return;
    setIsDeleting(true);
    try {
      await icpService.deleteICP(icpToDelete.id);
      toast.success(`ICP profile deleted successfully.`);
      handleCloseDelete();
      fetchData();
    } catch (err) {
      console.error('Failed to delete ICP profile:', err);
      toast.error('Failed to delete ICP profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Unique list of industries for filtering
  const uniqueIndustries = Array.from(new Set(icps.map((i) => i.industry).filter(Boolean)));

  // Filtered ICP records
  const filteredICPs = icps.filter((icp) => {
    const parsed = parseExtendedFields(icp);
    const campaignName = typeof icp.campaign === 'object' ? icp.campaign?.name : '';

    const matchesSearch =
      icp.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parsed.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parsed.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaignName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCampaign =
      selectedCampaignFilter === 'ALL' ||
      (typeof icp.campaign === 'object'
        ? String(icp.campaign?.id) === String(selectedCampaignFilter)
        : String(icp.campaign) === String(selectedCampaignFilter));

    const matchesIndustry =
      selectedIndustryFilter === 'ALL' || icp.industry === selectedIndustryFilter;

    return matchesSearch && matchesCampaign && matchesIndustry;
  });

  // Pagination calculation
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedICPs = filteredICPs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <PageHeader
        title="ICP Management"
        subtitle="Define, manage, and refine Ideal Customer Profiles for targeted sales campaigns"
        actionLabel="Create ICP"
        actionIcon={Plus}
        onActionClick={handleOpenCreate}
      >
        <Tooltip title="Refresh ICP records">
          <IconButton
            onClick={() => fetchData(true)}
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
            <Button color="inherit" size="small" onClick={() => fetchData(true)} sx={{ fontWeight: 700 }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Top Toolbar (Search, Filter by Campaign, Filter by Industry) */}
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
          {/* Search ICP */}
          <TextField
            placeholder="Search industry, title, location..."
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

          {/* Filter by Campaign */}
          <TextField
            select
            size="small"
            value={selectedCampaignFilter}
            onChange={(e) => {
              setSelectedCampaignFilter(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Filter size={16} color="#6b7280" />
                </InputAdornment>
              ),
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '180px' },
            }}
          >
            <MenuItem value="ALL">All Campaigns</MenuItem>
            {campaigns.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Filter by Industry */}
          <TextField
            select
            size="small"
            value={selectedIndustryFilter}
            onChange={(e) => {
              setSelectedIndustryFilter(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Target size={16} color="#6b7280" />
                </InputAdornment>
              ),
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '160px' },
            }}
          >
            <MenuItem value="ALL">All Industries</MenuItem>
            {uniqueIndustries.map((ind) => (
              <MenuItem key={ind} value={ind}>
                {ind}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
          Showing {filteredICPs.length} profile{filteredICPs.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Main Data Table */}
      {loading ? (
        <LoadingSpinner message="Loading ICP profiles..." minHeight="350px" />
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
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Industry</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Company Size</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Location</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Job Title</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Campaign Name</TableCell>
                  <TableCell align="right" sx={{ color: '#9ca3af', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedICPs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#6b7280' }}>
                      <Target size={36} color="#374151" style={{ marginBottom: 8 }} />
                      <Typography variant="body1" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                        No ICP profiles found
                      </Typography>
                      <Typography variant="caption">
                        Click "Create ICP" to add your first target persona.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedICPs.map((row) => {
                    const parsed = parseExtendedFields(row);
                    const campaignName = typeof row.campaign === 'object' ? row.campaign?.name : `Campaign #${row.campaign}`;

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          borderBottom: '1px solid #1f2937',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                        }}
                      >
                        <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>
                          {row.industry}
                        </TableCell>
                        <TableCell sx={{ color: '#9ca3af' }}>
                          {row.company_size}
                        </TableCell>
                        <TableCell sx={{ color: '#9ca3af' }}>
                          {parsed.location}
                        </TableCell>
                        <TableCell sx={{ color: '#818cf8', fontWeight: 600 }}>
                          {parsed.job_title}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {campaignName}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit ICP">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(row)}
                              sx={{ color: '#818cf8', mr: 1, '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' } }}
                            >
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete ICP">
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredICPs.length}
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

      {/* Create / Edit ICP Modal */}
      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        maxWidth="md"
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
          {selectedICP ? 'Edit ICP Profile' : 'Create New ICP Profile'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogContent sx={{ py: 3 }}>
            <Grid container spacing={2.5}>
              {/* Campaign Dropdown */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Target Campaign <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="campaign"
                  control={control}
                  rules={{ required: 'Campaign selection is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      error={Boolean(errors.campaign)}
                      helperText={errors.campaign?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    >
                      {campaigns.length === 0 ? (
                        <MenuItem value="" disabled>
                          No active campaigns available
                        </MenuItem>
                      ) : (
                        campaigns.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Industry */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Industry <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="industry"
                  control={control}
                  rules={{ required: 'Industry is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. B2B SaaS, FinTech, HealthTech"
                      error={Boolean(errors.industry)}
                      helperText={errors.industry?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Company Size */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Company Size <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="company_size"
                  control={control}
                  rules={{ required: 'Company size is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. 50-250 employees"
                      error={Boolean(errors.company_size)}
                      helperText={errors.company_size?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Location <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="location"
                  control={control}
                  rules={{ required: 'Location is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. United States, North America"
                      error={Boolean(errors.location)}
                      helperText={errors.location?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Job Title */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Job Title
                </Typography>
                <Controller
                  name="job_title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. VP of Sales, Head of Growth, CTO"
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Technologies */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Technologies Used
                </Typography>
                <Controller
                  name="technologies"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. Salesforce, Outreach, HubSpot, AWS"
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Pain Points */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Pain Points
                </Typography>
                <Controller
                  name="pain_points"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="e.g. Low response rates, manual lead enrichment"
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Keywords */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Keywords
                </Typography>
                <Controller
                  name="keywords"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="e.g. outbound sales, AI SDR, pipeline velocity"
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
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
              {selectedICP ? 'Save Changes' : 'Create ICP'}
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
          <AlertTriangle color="#ef4444" size={22} /> Delete ICP Profile
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Are you sure you want to delete the ICP profile for <strong>"{icpToDelete?.industry}"</strong>? This action cannot be undone.
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

export default ICP;
