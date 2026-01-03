import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RichTextEditor } from '../ui/RichTextEditor';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { 
  Bell, 
  Calendar, 
  Send, 
  Plus, 
  ChevronRight, 
  Clock, 
  Edit, 
  Trash2, 
  AlertCircle,
  X 
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
  scheduledTime: string;
  status: 'Scheduled' | 'Sent';
  createdAt: string;
}

interface NotificationFormData {
  title: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
  scheduledTime: string;
}

export default function NotificationDetailView() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const matchName = location.state?.matchName || `Match #${matchId}`;

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    priority: 'Medium',
    scheduledTime: '',
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Match Starting Soon',
      message: 'India vs Australia match will start in 30 minutes!',
      priority: 'High',
      scheduledTime: '2025-12-01T13:30:00',
      status: 'Scheduled',
      createdAt: '2025-11-30T10:00:00'
    },
    {
      id: 2,
      title: 'Toss Update',
      message: 'India won the toss and elected to bat first',
      priority: 'Medium',
      scheduledTime: '2025-12-01T14:00:00',
      status: 'Sent',
      createdAt: '2025-12-01T14:00:00'
    },
    {
      id: 3,
      title: 'Innings Break',
      message: 'India scored 287/5 in 50 overs. Australia to chase.',
      priority: 'High',
      scheduledTime: '2025-12-01T17:30:00',
      status: 'Sent',
      createdAt: '2025-12-01T17:30:00'
    },
  ]);

  const openForm = (notification?: Notification) => {
    if (notification) {
      setEditingNotification(notification);
      setFormData({
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        scheduledTime: notification.scheduledTime.slice(0, 16), // Format for datetime-local input
      });
    } else {
      setEditingNotification(null);
      setFormData({
        title: '',
        message: '',
        priority: 'Medium',
        scheduledTime: '',
      });
    }
    setFormOpen(true);
  };

  const saveNotification = () => {
    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formData.message.trim()) {
      alert('Please enter a message');
      return;
    }
    if (!formData.scheduledTime) {
      alert('Please select a scheduled time');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const newNotification: Notification = {
        id: editingNotification ? editingNotification.id : Date.now(),
        title: formData.title.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
        scheduledTime: formData.scheduledTime,
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
      };

      if (editingNotification) {
        setNotifications(prev => prev.map(n => n.id === editingNotification.id ? newNotification : n));
      } else {
        setNotifications(prev => [...prev, newNotification]);
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        priority: 'Medium',
        scheduledTime: '',
      });
      setEditingNotification(null);
      setFormOpen(false);
      setLoading(false);
    }, 500);
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const scheduledNotifications = notifications.filter(n => n.status === 'Scheduled');
  const sentNotifications = notifications.filter(n => n.status === 'Sent');

  const renderNotificationTable = (data: Notification[]) => (
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700">
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[200px]">Title</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[300px]">Message</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[100px]">Priority</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[180px]">Scheduled Time</TableHead>
            <TableHead className="text-slate-700 dark:text-slate-300 min-w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="border-slate-200 dark:border-slate-700">
              <TableCell colSpan={5} className="text-center text-slate-500 dark:text-slate-400 py-8">
                No notifications found
              </TableCell>
            </TableRow>
          ) : (
            data.map((notification) => (
              <TableRow key={notification.id} className="border-slate-200 dark:border-slate-700">
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">{notification.title}</div>
                </TableCell>
                <TableCell>
                  <div 
                    className="text-slate-700 dark:text-slate-300 line-clamp-2" 
                    dangerouslySetInnerHTML={{ __html: notification.message }}
                  />
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={
                      notification.priority === 'High' 
                        ? 'border-red-500 text-red-600 dark:text-red-400' 
                        : notification.priority === 'Medium'
                        ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                        : 'border-green-500 text-green-600 dark:text-green-400'
                    }
                  >
                    {notification.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-2">
                    <Clock className="size-4" />
                    {new Date(notification.scheduledTime).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {notification.status === 'Scheduled' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={() => openForm(notification)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    )}
                    {notification.status === 'Sent' && (
                      <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        <Send className="size-3 mr-1 text-blue-600 dark:text-blue-400" />
                        Sent
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Bell className="size-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-1">
                  <span 
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                    onClick={() => navigate('/notifications')}
                  >
                    Notifications
                  </span>
                  <ChevronRight className="size-4" />
                  <span className="text-slate-900 dark:text-white">Match Details</span>
                </div>
                <CardTitle className="text-slate-900 dark:text-white text-2xl">{matchName}</CardTitle>
              </div>
            </div>
            <Button 
              onClick={() => openForm()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="size-4 mr-2" />
              Create Notification
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger 
            value="scheduled" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
          >
            <Calendar className="size-4 mr-2" />
            Events Lined Up ({scheduledNotifications.length})
          </TabsTrigger>
          <TabsTrigger 
            value="sent" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
          >
            <Send className="size-4 mr-2" />
            Sent ({sentNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-6">
          {renderNotificationTable(scheduledNotifications)}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {renderNotificationTable(sentNotifications)}
        </TabsContent>
      </Tabs>

      {/* Custom Modal with Portal */}
      {formOpen && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setFormOpen(false)}
          />
          
          {/* Modal Content - Fixed Center */}
          <div 
            className="fixed top-1/2 left-1/2 w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-2xl border border-slate-200 p-0 flex flex-col max-h-[90vh] dark:bg-slate-800 dark:border-slate-700 z-[2001]"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {editingNotification ? 'Edit Notification' : 'Create Notification'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Schedule a notification for {matchName}
                </p>
              </div>
              <button 
                onClick={() => setFormOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white mt-1.5"
                  placeholder="e.g. Match Starting Soon"
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Message *</Label>
                <div className="mt-1.5">
                  <RichTextEditor
                    value={formData.message}
                    onChange={(value) => setFormData({ ...formData, message: value })}
                    placeholder="Enter notification message..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Priority</Label>
                  <div className="mt-1.5">
                    <Select
                      value={formData.priority}
                      onValueChange={(v: 'High' | 'Medium' | 'Low') => setFormData({ ...formData, priority: v })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white z-[2020]">
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Scheduled Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white mt-1.5"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <AlertCircle className="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  Notifications will be sent automatically at the scheduled time. Make sure to review before saving.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveNotification}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Saving..." : "Save Notification"}
              </Button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
