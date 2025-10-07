import { useState, useEffect } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import codeService from '../../services/code.service';
import { toast } from 'react-hot-toast';

interface WorktreeSectionProps {
  ticketId: string;
  branchName: string | null;
  analysisStatus: 'complete' | 'pending' | 'none';
  onWorktreeCreated?: (worktreePath: string) => void;
}

const WorktreeSection = ({
  ticketId,
  branchName,
  analysisStatus,
  onWorktreeCreated,
}: WorktreeSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [creatingWorktree, setCreatingWorktree] = useState(false);
  const [worktreeData, setWorktreeData] = useState<any>(null);

  // Form inputs
  const [subfolder, setSubfolder] = useState('backend');
  const [baseBranchType, setBaseBranchType] = useState<'sit' | 'main' | 'other'>('main');
  const [customBaseBranch, setCustomBaseBranch] = useState('');
  const [envHandling, setEnvHandling] = useState<'link' | 'copy' | 'skip'>('link');
  const [shareNodeModules, setShareNodeModules] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBranch, setDeleteBranch] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch workflow data on mount to check if worktree already exists
  useEffect(() => {
    fetchWorkflowData();
  }, [ticketId]);

  const fetchWorkflowData = async () => {
    try {
      const workflow = await codeService.getWorkflowByTicketId(ticketId);
      if (workflow?.worktreeId && workflow?.metadata) {
        setWorktreeData({
          id: workflow.worktreeId,
          worktreePath: workflow.metadata.worktreePath,
          branchName: workflow.generatedBranchName,
          subfolder: workflow.metadata.subfolder,
        });
      }
    } catch (error) {
      console.error('Failed to fetch workflow data:', error);
    }
  };

  const getBaseBranch = () => {
    if (baseBranchType === 'other') {
      return customBaseBranch || 'main';
    }
    return baseBranchType;
  };

  const handleCreateWorktree = async () => {
    if (!branchName) {
      toast.error('Branch name must be generated first');
      return;
    }

    if (!subfolder.trim()) {
      toast.error('Please enter a subfolder');
      return;
    }

    if (baseBranchType === 'other' && !customBaseBranch.trim()) {
      toast.error('Please enter a custom base branch name');
      return;
    }

    setCreatingWorktree(true);
    const toastId = toast.loading('Creating worktree...');

    try {
      const result = await codeService.createWorktree(
        ticketId,
        subfolder,
        getBaseBranch(),
        envHandling,
        shareNodeModules
      );

      const worktreePath = result.metadata?.worktreePath;

      setWorktreeData({
        id: result.worktreeId,
        worktreePath,
        branchName: result.generatedBranchName,
        subfolder: result.metadata?.subfolder,
      });

      toast.success(`Worktree created successfully!`, {
        id: toastId,
        duration: 5000,
      });

      if (onWorktreeCreated && worktreePath) {
        onWorktreeCreated(worktreePath);
      }
    } catch (error: any) {
      console.error('Worktree creation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Failed to create worktree: ${errorMessage}`, {
        id: toastId,
        duration: 6000,
      });
    } finally {
      setCreatingWorktree(false);
    }
  };

  const handleCopyPath = () => {
    if (worktreeData?.worktreePath) {
      navigator.clipboard.writeText(worktreeData.worktreePath);
      toast.success('Worktree path copied to clipboard!');
    }
  };

  const handleDeleteWorktree = async () => {
    setDeleting(true);
    const toastId = toast.loading('Deleting worktree...');

    try {
      await codeService.deleteWorktree(ticketId, { deleteBranch });

      setWorktreeData(null);
      setShowDeleteModal(false);

      toast.success(
        `Worktree deleted successfully${deleteBranch ? ' (branch deleted)' : ''}!`,
        { id: toastId, duration: 5000 }
      );
    } catch (error: any) {
      console.error('Worktree deletion failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Failed to delete worktree: ${errorMessage}`, {
        id: toastId,
        duration: 6000,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5" />
            Worktree
          </CardTitle>
          <div className="flex items-center gap-2">
            {worktreeData ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Created
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                <AlertCircle className="w-4 h-4 mr-1" />
                Not Created
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {worktreeData ? (
            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Path:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-white px-3 py-2 rounded border">
                        {worktreeData.worktreePath}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPath}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Branch:</span>
                      <p className="text-gray-900 mt-1">
                        <code className="bg-white px-2 py-1 rounded text-xs border">
                          {worktreeData.branchName}
                        </code>
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Subfolder:</span>
                      <p className="text-gray-900 mt-1">
                        <code className="bg-white px-2 py-1 rounded text-xs border">
                          {worktreeData.subfolder}
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <Button
                variant="outline"
                className="w-full mt-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Worktree
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-6">
                <FolderGit2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {branchName
                    ? 'Create an isolated worktree for development'
                    : 'Generate a branch name first'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Worktrees allow you to work on multiple branches simultaneously
                </p>
              </div>

              {branchName && (
                <div className="space-y-4">
                  {/* Subfolder Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Subfolder <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subfolder}
                      onChange={(e) => setSubfolder(e.target.value)}
                      placeholder="e.g., backend, frontend"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500">
                      The subfolder relative to your project root (e.g., "backend")
                    </p>
                  </div>

                  {/* Base Branch Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Base Branch <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {/* Radio: sit */}
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="baseBranch"
                          value="sit"
                          checked={baseBranchType === 'sit'}
                          onChange={() => setBaseBranchType('sit')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">sit</span>
                      </label>

                      {/* Radio: main */}
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="baseBranch"
                          value="main"
                          checked={baseBranchType === 'main'}
                          onChange={() => setBaseBranchType('main')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">main</span>
                      </label>

                      {/* Radio: other with input */}
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="baseBranch"
                            value="other"
                            checked={baseBranchType === 'other'}
                            onChange={() => setBaseBranchType('other')}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-sm">other</span>
                        </label>
                        {baseBranchType === 'other' && (
                          <input
                            type="text"
                            value={customBaseBranch}
                            onChange={(e) => setCustomBaseBranch(e.target.value)}
                            placeholder="Enter custom branch name"
                            className="w-full ml-6 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Environment Handling */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Environment File Handling
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="envHandling"
                          value="link"
                          checked={envHandling === 'link'}
                          onChange={() => setEnvHandling('link')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Link (symlink to main .env)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="envHandling"
                          value="copy"
                          checked={envHandling === 'copy'}
                          onChange={() => setEnvHandling('copy')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Copy (independent .env file)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="envHandling"
                          value="skip"
                          checked={envHandling === 'skip'}
                          onChange={() => setEnvHandling('skip')}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm">Skip (no .env setup)</span>
                      </label>
                    </div>
                  </div>

                  {/* Node Modules Sharing */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareNodeModules}
                        onChange={(e) => setShareNodeModules(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm font-medium">
                        Share node_modules from main repository
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">
                      Creates a symlink to the main node_modules instead of installing separately
                    </p>
                  </div>

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateWorktree}
                    disabled={creatingWorktree || !subfolder.trim() || (baseBranchType === 'other' && !customBaseBranch.trim())}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <FolderGit2
                      className={`w-4 h-4 mr-2 ${creatingWorktree ? 'animate-pulse' : ''}`}
                    />
                    {creatingWorktree ? 'Creating Worktree...' : 'Create Worktree'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Worktree?</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">
                This will permanently delete the worktree directory and free up disk space.
              </p>

              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Path to be deleted:</p>
                <code className="text-xs text-gray-900 break-all">
                  {worktreeData?.worktreePath}
                </code>
              </div>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteBranch}
                  onChange={(e) => setDeleteBranch(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Also delete the branch</span>
                  <p className="text-xs text-gray-500 mt-1">
                    "{worktreeData?.branchName}"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (Uncheck if you've already merged or want to keep working on it)
                  </p>
                </div>
              </label>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ Warning: Any uncommitted changes in the worktree will be lost!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteBranch(false);
                }}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteWorktree}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Worktree'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WorktreeSection;
