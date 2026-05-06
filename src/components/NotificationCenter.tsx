import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, BellOff, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { db, getFCMToken, onMessageListener } from '@/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  updateDoc, doc, deleteDoc, serverTimestamp, addDoc
} from 'firebase/firestore';
import type { AppNotification } from '@/types/notification';

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Show local notification
export const showLocalNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/img/liflu-icon.png',
      badge: '/img/liflu-icon.png',

      tag: 'liflu-notification',
    });
  }
};

export const NotificationCenter: React.FC = () => {
  const { user, setActiveTab } = useStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const initialSnapshotLoadedRef = useRef(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!user?.uid || !permissionGranted) return;

    getFCMToken().then(async (token) => {
      if (!token) return;
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: token,
        notificationsEnabled: true
      });
    }).catch((e) => {
      console.error('Error saving FCM token:', e);
    });
  }, [user?.uid, permissionGranted]);

  // Subscribe to notifications from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('Setting up notifications listener for user:', user.uid);
    
    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Notifications snapshot received, docs count:', snapshot.docs.length);
      
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as AppNotification[];

      console.log('Parsed notifications:', notifs);

      if (initialSnapshotLoadedRef.current) {
        console.log('Processing doc changes...');
        snapshot.docChanges().forEach((change) => {
          console.log('Doc change type:', change.type, 'doc:', change.doc.id);
          
          if (change.type !== 'added') return;

          const notification = {
            id: change.doc.id,
            ...change.doc.data(),
            createdAt: change.doc.data().createdAt?.toDate() || new Date()
          } as AppNotification;

          console.log('New notification added:', notification);

          if (!notification.read) {
            console.log('Showing local notification for:', notification.title);
            showLocalNotification(notification.title, notification.body);
          }
        });
      } else {
        console.log('Initial snapshot loaded, skipping notifications');
        initialSnapshotLoadedRef.current = true;
      }

      setNotifications(notifs);
    });
    return () => {
      initialSnapshotLoadedRef.current = false;
      unsubscribe();
    };
  }, [user?.uid]);

  // Listen for FCM messages
  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      console.log('FCM message received:', payload);
      if (payload.notification) {
        showLocalNotification(
          payload.notification.title || 'Liflu',
          payload.notification.body || ''
        );
      }
    });
    
    return unsubscribe;
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) &&
          bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read and handle click
  const handleNotificationClick = async (notification: AppNotification) => {
    if (!user?.uid) return;
    
    // Mark as read
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications/${notification.id}`), {
        read: true
      });
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }

    // Handle message notifications - open chat
    if (notification.type === 'message' && notification.data?.conversationId) {
      setActiveTab('chat');
      setIsOpen(false);
      // The chat component will handle opening the conversation
    }
  };

  // Mark notification as read (legacy - kept for compatibility)
  const markAsRead = async (notificationId: string) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications/${notificationId}`), {
        read: true
      });
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.uid) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/notifications/${notificationId}`));
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!user?.uid) return;
    for (const n of notifications) {
      await deleteNotification(n.id);
    }
  };

  // Request permission
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    
    if (granted) {
      // Get FCM token and save to user profile
      const token = await getFCMToken();
      if (token && user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          fcmToken: token,
          notificationsEnabled: true
        });
      }
    }
  };

  // Format time ago
  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_reminder': return '📋';
      case 'habit_reminder': return '🔥';
      case 'achievement': return '🏆';
      case 'streak': return '⚡';
      case 'message': return '💬';
      default: return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative w-10 h-10 rounded-full flex items-center justify-center transition-all',
          'bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95'
        )}
      >
        {permissionGranted ? (
          <Bell size={18} className={cn(
            'transition-colors',
            unreadCount > 0 ? 'text-accent-purple' : 'text-white/70'
          )} />
        ) : (
          <BellOff size={18} className="text-white/40" />
        )}
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 max-h-96 bg-[#1a0f2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-sm font-black text-white uppercase tracking-wider font-display">
                Уведомления
              </span>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Очистить все"
                  >
                    <Trash2 size={14} className="text-white/50" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={14} className="text-white/50" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-72 overflow-y-auto">
              {!permissionGranted ? (
                <div className="p-4 text-center">
                  <BellOff size={32} className="mx-auto text-white/30 mb-3" />
                  <p className="text-sm text-white/60 mb-3 font-display">
                    Включите уведомления
                  </p>
                  <button
                    onClick={handleRequestPermission}
                    className="px-4 py-2 bg-accent-purple rounded-xl text-sm font-bold text-white hover:bg-accent-purple/80 transition-colors"
                  >
                    Включить
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={32} className="mx-auto text-white/20 mb-3" />
                  <p className="text-sm text-white/40 font-display">
                    Нет уведомлений
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-3 hover:bg-white/5 transition-colors cursor-pointer',
                        !notification.read && 'bg-accent-purple/5'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-semibold font-display',
                              notification.read ? 'text-white/70' : 'text-white'
                            )}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 rounded hover:bg-white/10 flex-shrink-0"
                            >
                              <X size={12} className="text-white/40" />
                            </button>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                          <p className="text-[10px] text-white/30 mt-1">
                            {timeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <div className="border-t border-white/5 p-2">
                <button
                  onClick={markAllAsRead}
                  className="w-full py-2 text-xs font-bold text-accent-purple hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  Прочитать все
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to add notification
export const addNotification = async (
  userId: string, 
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
) => {
  try {
    console.log('addNotification called for user:', userId, 'notification:', notification);
    
    const docRef = await addDoc(collection(db, `users/${userId}/notifications`), {
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    });
    
    console.log('Notification added with ID:', docRef.id);
  } catch (e) {
    console.error('Error adding notification:', e);
  }
};
