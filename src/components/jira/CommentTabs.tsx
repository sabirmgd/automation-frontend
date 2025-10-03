import React from 'react';
import { MessageCircle, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

interface CommentTabsProps {
  jiraCommentCount: number;
  hiddenCommentCount: number;
  activeTab: string;
  onTabChange: (value: string) => void;
  children: {
    jiraContent: React.ReactNode;
    hiddenContent: React.ReactNode;
  };
}

const CommentTabs: React.FC<CommentTabsProps> = ({
  jiraCommentCount,
  hiddenCommentCount,
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="jira" className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <span>Jira Comments</span>
          {jiraCommentCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
              {jiraCommentCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="hidden" className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Internal Notes</span>
          {hiddenCommentCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
              {hiddenCommentCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="jira" className="mt-4">
        {children.jiraContent}
      </TabsContent>

      <TabsContent value="hidden" className="mt-4">
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-900 font-medium">Internal Notes</p>
              <p className="text-blue-700 text-xs mt-0.5">
                These notes are only visible to your team and not synced with Jira
              </p>
            </div>
          </div>
        </div>
        {children.hiddenContent}
      </TabsContent>
    </Tabs>
  );
};

export default CommentTabs;