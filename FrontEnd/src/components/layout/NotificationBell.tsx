'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Bell,
  Trophy,
  UserPlus,
  Users,
  Flame,
  Leaf,
  Medal,
  MessageCircle,
  TrendingUp,
  Check,
  CheckCheck,
  X,
  Loader2
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

const iconMap: Record<string, React.ReactNode> = {
  achievement: <Trophy className="h-4 w-4 text-amber-500" />,
  friend_request: <UserPlus className="h-4 w-4 text-blue-500" />,
  friend_accepted: <Users className="h-4 w-4 text-emerald-500" />,
  challenge_invite: <Flame className="h-4 w-4 text-orange-500" />,
  challenge_complete: <Medal className="h-4 w-4 text-purple-500" />,
  team_invite: <Users className="h-4 w-4 text-indigo-500" />,
  leaderboard: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  milestone: <Leaf className="h-4 w-4 text-green-500" />,
  message: <MessageCircle className="h-4 w-4 text-blue-500" />,
};

const bgMap: Record<string, string> = {
  achievement: 'bg-amber-50',
  friend_request: 'bg-blue-50',
  friend_accepted: 'bg-emerald-50',
  challenge_invite: 'bg-orange-50',
  challenge_complete: 'bg-purple-50',
  team_invite: 'bg-indigo-50',
  leaderboard: 'bg-emerald-50',
  milestone: 'bg-green-50',
  message: 'bg-blue-50',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function NotificationItem({ 
  notification, 
  onMarkRead 
}: { 
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const icon = iconMap[notification.type] || <Bell className="h-4 w-4 text-slate-500" />;
  const bgColor = bgMap[notification.type] || 'bg-slate-50';
  
  return (
    <div 
      className={cn(
        "p-3 hover:bg-slate-50 transition-colors cursor-pointer border-b last:border-b-0",
        !notification.is_read && "bg-blue-50/50"
      )}
      onClick={() => !notification.is_read && onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-full shrink-0",
          bgColor
        )}>
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm text-slate-800",
            !notification.is_read && "font-medium"
          )}>
            {notification.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
        
        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    }
    
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/notifications/${id}/read`, {
        method: 'POST'
      });
      
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await fetch('http://127.0.0.1:8000/api/notifications/read-all', {
        method: 'POST'
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </>
                )}
              </Button>
            )}
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-slate-50 text-center">
              <Button
                variant="link"
                size="sm"
                className="text-blue-600 text-xs"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
