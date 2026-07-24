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
  Chip,
} from '@mui/material';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Users,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import leadService from '../services/leadService';
import campaignService from '../services/campaignService';

const STATUS_COLOR_MAP = {
  NEW: { bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', label: 'New' },
  QUALIFIED: { bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Qualified' },
  CONTACTED: { bgcolor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', label: 'Contacted' },
  EMAIL_SENT: { bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', label: 'Email Sent' },
  REPLIED: { bgcolor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', label: 'Replied' },
  REJECTED: { bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Rejected' },
};

const Leads = () => {
  // State management
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Create / Edit Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Generate Leads Modal State
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedGenCampaign, setSelectedGenCampaign] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // Delete Confirmation State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form for Create/Edit
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      campaign: '',
      company_name: '',
      contact_name: '',
      contact_email: '',
      industry: '',
      country: '',
      status: 'NEW',
    },
  });

  // Fetch leads and campaigns
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);
    try {
      const [leadData, campaignData] = await Promise.all([
        leadService.getLeads(),
        campaignService.getCampaigns(),
      ]);

      const leadList = Array.isArray(leadData) ? leadData : leadData.results || [];
      const campaignList = Array.isArray(campaignData) ? campaignData : campaignData.results || [];

      setLeads(leadList);
      setCampaigns(campaignList);
    } catch (err) {
      console.error('Failed to fetch lead data:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to load lead records from server.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create Lead Modal
  const handleOpenCreate = () => {
    setSelectedLead(null);
    reset({
      campaign: campaigns.length > 0 ? campaigns[0].id : '',
      company_name: '',
      contact_name: '',
      contact_email: '',
      industry: 'Software',
      country: 'United States',
      status: 'NEW',
    });
    setFormOpen(true);
  };

  // Open Edit Lead Modal
  const handleOpenEdit = (lead) => {
    setSelectedLead(lead);
    const campaignId = typeof lead.campaign === 'object' ? lead.campaign?.id : lead.campaign;

    reset({
      campaign: campaignId || '',
      company_name: lead.company_name || '',
      contact_name: lead.contact_name || '',
      contact_email: lead.contact_email || '',
      industry: lead.industry || '',
      country: lead.country || '',
      status: lead.status || 'NEW',
    });
    setFormOpen(true);
  };

  // Close Form Modal
  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedLead(null);
  };

  // Submit Create or Edit Form
  const onSubmitForm = async (formData) => {
    try {
      const payload = {
        ...formData,
        campaign: Number(formData.campaign),
      };

      if (selectedLead) {
        // Edit lead using PUT
        await leadService.updateLead(selectedLead.id, payload);
        toast.success(`Lead "${formData.contact_name}" updated successfully!`);
      } else {
        // Create lead using POST
        await leadService.createLead(payload);
        toast.success(`Lead "${formData.contact_name}" created successfully!`);
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      console.error('Failed to save lead:', err);
      const errMsg =
        err.response?.data?.contact_email?.[0] ||
        err.response?.data?.company_name?.[0] ||
        err.response?.data?.detail ||
        'Error saving lead record.';
      toast.error(errMsg);
    }
  };

  // Open Generate Modal
  const handleOpenGenerate = () => {
    setGenResult(null);
    setSelectedGenCampaign(campaigns.length > 0 ? campaigns[0].id : '');
    setGenerateOpen(true);
  };

  // Submit Generate Leads
  const handleGenerateSubmit = async () => {
    if (!selectedGenCampaign) {
      toast.error('Please select a campaign.');
      return;
    }
    setIsGenerating(true);
    setGenResult(null);
    try {
      const res = await leadService.generateLeads(selectedGenCampaign);
      setGenResult(res);
      toast.success(res.message || `Lead generation completed! (${res.generated_count} new leads)`);
      fetchData();
    } catch (err) {
      console.error('Failed to generate leads:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Error generating leads.';
      toast.error(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (lead) => {
    setLeadToDelete(lead);
    setDeleteOpen(true);
  };

  // Close Delete Confirmation
  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setLeadToDelete(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await leadService.deleteLead(leadToDelete.id);
      toast.success(`Lead "${leadToDelete.contact_name}" deleted successfully.`);
      handleCloseDelete();
      fetchData();
    } catch (err) {
      console.error('Failed to delete lead:', err);
      toast.error('Failed to delete lead record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Leads calculation
  const filteredLeads = leads.filter((lead) => {
    const campaignName = typeof lead.campaign === 'object' ? lead.campaign?.name : '';

    const matchesSearch =
      lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaignName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCampaign =
      selectedCampaignFilter === 'ALL' ||
      (typeof lead.campaign === 'object'
        ? String(lead.campaign?.id) === String(selectedCampaignFilter)
        : String(lead.campaign) === String(selectedCampaignFilter));

    const matchesStatus =
      selectedStatusFilter === 'ALL' || lead.status === selectedStatusFilter;

    return matchesSearch && matchesCampaign && matchesStatus;
  });

  // Pagination calculation
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedLeads = filteredLeads.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <PageHeader
        title="Lead Discovery & Management"
        subtitle="Search, generate, and track qualified prospect records across active ICP campaigns"
      >
        <Tooltip title="Refresh leads list">
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

        <Button
          variant="outlined"
          startIcon={<Sparkles size={18} />}
          onClick={handleOpenGenerate}
          sx={{
            borderColor: '#6366f1',
            color: '#818cf8',
            fontWeight: 700,
            px: 2,
            py: 1,
            borderRadius: 2.5,
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)', borderColor: '#818cf8' },
          }}
        >
          Generate Leads
        </Button>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#6366f1',
            color: '#ffffff',
            fontWeight: 600,
            px: 2.5,
            py: 1,
            borderRadius: 2.5,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          Create Lead
        </Button>
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

      {/* Top Toolbar (Search, Filter by Campaign, Filter by Status) */}
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
          {/* Search */}
          <TextField
            placeholder="Search company, contact, email, industry..."
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
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '260px' },
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

          {/* Filter by Status */}
          <TextField
            select
            size="small"
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setPage(0);
            }}
            InputProps={{
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px', minWidth: '150px' },
            }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="NEW">New</MenuItem>
            <MenuItem value="QUALIFIED">Qualified</MenuItem>
            <MenuItem value="CONTACTED">Contacted</MenuItem>
            <MenuItem value="EMAIL_SENT">Email Sent</MenuItem>
            <MenuItem value="REPLIED">Replied</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </TextField>
        </Box>

        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
          Showing {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Main Data Table */}
      {loading ? (
        <LoadingSpinner message="Loading verified leads..." minHeight="350px" />
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
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Company Name</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Contact Name</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Industry</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Campaign</TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ color: '#9ca3af', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#6b7280' }}>
                      <Users size={36} color="#374151" style={{ marginBottom: 8 }} />
                      <Typography variant="body1" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                        No leads found
                      </Typography>
                      <Typography variant="caption">
                        Click "Generate Leads" or "Create Lead" to add prospects.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLeads.map((row) => {
                    const campaignName = typeof row.campaign === 'object' ? row.campaign?.name : `Campaign #${row.campaign}`;
                    const statusConfig = STATUS_COLOR_MAP[row.status] || { bgcolor: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', label: row.status };

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
                          {row.company_name}
                        </TableCell>
                        <TableCell sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                          {row.contact_name}
                        </TableCell>
                        <TableCell sx={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {row.contact_email}
                        </TableCell>
                        <TableCell sx={{ color: '#9ca3af' }}>
                          {row.industry || '—'}
                        </TableCell>
                        <TableCell sx={{ color: '#818cf8', fontWeight: 600 }}>
                          {campaignName}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              bgcolor: statusConfig.bgcolor,
                              color: statusConfig.color,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit Lead">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(row)}
                              sx={{ color: '#818cf8', mr: 1, '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' } }}
                            >
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Lead">
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
            count={filteredLeads.length}
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

      {/* Generate Leads Modal */}
      <Dialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
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
          <Sparkles color="#818cf8" size={22} /> Generate Leads for ICP
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
            Select an active campaign. The engine will match prospect companies against the campaign's ICP rules.
          </Typography>

          <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
            Campaign <span style={{ color: '#ef4444' }}>*</span>
          </Typography>
          <TextField
            select
            fullWidth
            value={selectedGenCampaign}
            onChange={(e) => setSelectedGenCampaign(e.target.value)}
            InputProps={{
              style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
            }}
          >
            {campaigns.length === 0 ? (
              <MenuItem value="" disabled>
                No campaigns available
              </MenuItem>
            ) : (
              campaigns.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))
            )}
          </TextField>

          {/* Results Summary Display */}
          {genResult && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 2.5, bgcolor: '#0b0f17', border: '1px solid #1f2937' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle2 size={18} /> {genResult.message}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                      Generated Leads
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981' }}>
                      {genResult.generated_count ?? 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                      Duplicates Skipped
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                      {genResult.skipped_duplicates ?? 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGenerateOpen(false)} sx={{ color: '#9ca3af', textTransform: 'none' }}>
            Close
          </Button>
          <Button
            onClick={handleGenerateSubmit}
            variant="contained"
            disabled={isGenerating || !selectedGenCampaign}
            sx={{
              bgcolor: '#6366f1',
              color: '#ffffff',
              fontWeight: 700,
              px: 2.5,
              textTransform: 'none',
              '&:hover': { bgcolor: '#4f46e5' },
            }}
          >
            {isGenerating ? 'Generating...' : 'Run Lead Generator'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit Lead Modal */}
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
          {selectedLead ? 'Edit Lead Record' : 'Create Manual Lead'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <DialogContent sx={{ py: 3 }}>
            <Grid container spacing={2.5}>
              {/* Campaign */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Campaign <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="campaign"
                  control={control}
                  rules={{ required: 'Campaign is required' }}
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
                      {campaigns.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
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
                      <MenuItem value="NEW">New</MenuItem>
                      <MenuItem value="QUALIFIED">Qualified</MenuItem>
                      <MenuItem value="CONTACTED">Contacted</MenuItem>
                      <MenuItem value="EMAIL_SENT">Email Sent</MenuItem>
                      <MenuItem value="REPLIED">Replied</MenuItem>
                      <MenuItem value="REJECTED">Rejected</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              {/* Company Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Company Name <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="company_name"
                  control={control}
                  rules={{ required: 'Company Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. Acme Corp"
                      error={Boolean(errors.company_name)}
                      helperText={errors.company_name?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Contact Name */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Contact Name <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="contact_name"
                  control={control}
                  rules={{ required: 'Contact Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. Jane Doe"
                      error={Boolean(errors.contact_name)}
                      helperText={errors.contact_name?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Contact Email */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Contact Email <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <Controller
                  name="contact_email"
                  control={control}
                  rules={{
                    required: 'Contact Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address format',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="jane@acme.com"
                      error={Boolean(errors.contact_email)}
                      helperText={errors.contact_email?.message}
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Industry */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Industry
                </Typography>
                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. Software, Legal AI"
                      InputProps={{
                        style: { color: '#ffffff', backgroundColor: '#0b0f17', borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Country */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#d1d5db', fontWeight: 600, mb: 0.8 }}>
                  Country
                </Typography>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="e.g. USA, UK, Canada"
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
              {selectedLead ? 'Save Changes' : 'Create Lead'}
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
          <AlertTriangle color="#ef4444" size={22} /> Delete Lead Record
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Are you sure you want to delete lead <strong>"{leadToDelete?.contact_name}"</strong> at {leadToDelete?.company_name}? This action cannot be undone.
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

export default Leads;
