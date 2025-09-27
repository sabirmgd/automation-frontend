import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import type { JiraAccount, CreateJiraAccountDto, UpdateJiraAccountDto } from '../../types/jira.types';

interface JiraAccountModalProps {
  open: boolean;
  account?: JiraAccount | null;
  onClose: () => void;
  onSave: (data: CreateJiraAccountDto | UpdateJiraAccountDto) => Promise<void>;
}

export default function JiraAccountModal({
  open,
  account,
  onClose,
  onSave
}: JiraAccountModalProps) {
  const [formData, setFormData] = useState({
    accountName: '',
    jiraUrl: '',
    email: '',
    apiToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        accountName: account.accountName || '',
        jiraUrl: account.jiraUrl || '',
        email: account.email || '',
        apiToken: ''
      });
    } else {
      setFormData({
        accountName: '',
        jiraUrl: '',
        email: '',
        apiToken: ''
      });
    }
    setErrors({});
  }, [account, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (!formData.jiraUrl.trim()) {
      newErrors.jiraUrl = 'Jira URL is required';
    } else if (!formData.jiraUrl.match(/^https?:\/\/.+/)) {
      newErrors.jiraUrl = 'Please enter a valid URL';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!account && !formData.apiToken.trim()) {
      newErrors.apiToken = 'API token is required for new accounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        accountName: formData.accountName.trim(),
        jiraUrl: formData.jiraUrl.trim(),
        email: formData.email.trim(),
      };

      if (formData.apiToken) {
        data.apiToken = formData.apiToken;
      }

      await onSave(data);
    } catch (error: any) {
      console.error('Failed to save account:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save account. Please try again.';
      setErrors({ submit: errorMessage });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Jira Account' : 'Add Jira Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="e.g., My Company Jira"
              className={errors.accountName ? 'border-red-500' : ''}
            />
            {errors.accountName && (
              <p className="text-sm text-red-500">{errors.accountName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraUrl">Jira URL</Label>
            <Input
              id="jiraUrl"
              value={formData.jiraUrl}
              onChange={(e) => setFormData({ ...formData, jiraUrl: e.target.value })}
              placeholder="https://your-domain.atlassian.net"
              className={errors.jiraUrl ? 'border-red-500' : ''}
            />
            {errors.jiraUrl && (
              <p className="text-sm text-red-500">{errors.jiraUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your-email@company.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiToken">
              API Token {account && '(leave empty to keep current)'}
            </Label>
            <Input
              id="apiToken"
              type="password"
              value={formData.apiToken}
              onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
              placeholder="Your Jira API token"
              className={errors.apiToken ? 'border-red-500' : ''}
            />
            {errors.apiToken && (
              <p className="text-sm text-red-500">{errors.apiToken}</p>
            )}
            <p className="text-sm text-gray-500">
              Generate an API token from your Atlassian account settings
            </p>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : account ? 'Update' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}