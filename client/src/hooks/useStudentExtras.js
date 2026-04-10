import { useCallback, useEffect, useState } from 'react';
import {
  addBookmark,
  getBookmarks,
  getNotifications,
  getTrendingResources,
  markNotificationRead,
  removeBookmark,
  searchResources,
} from '../services/api';

// export function useBookmarks() {
//   const [bookmarks, setBookmarks] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const refresh = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await getBookmarks();
//       setBookmarks(data.bookmarks || []);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     refresh();
//   }, [refresh]);

//   const toggle = useCallback(
//     async (resourceId) => {
//       const existing = bookmarks.find((b) => b.resourceId?._id === resourceId);
//       if (existing) {
//         await removeBookmark(existing._id);
//       } else {
//         await addBookmark(resourceId);
//       }
//       await refresh();
//     },
//     [bookmarks, refresh]
//   );

//   const isBookmarked = useCallback(
//     (resourceId) => bookmarks.some((b) => b.resourceId?._id === resourceId),
//     [bookmarks]
//   );

//   return { bookmarks, loading, refresh, toggle, isBookmarked };
// }

// export function useTrending(sortBy = 'downloads') {
//   const [resources, setResources] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const refresh = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await getTrendingResources(sortBy);
//       setResources(data.resources || []);
//     } finally {
//       setLoading(false);
//     }
//   }, [sortBy]);

//   useEffect(() => {
//     refresh();
//   }, [refresh]);

//   return { resources, loading, refresh };
// }

// export function useNotifications() {
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);

//   const refresh = useCallback(async () => {
//     const data = await getNotifications();
//     setNotifications(data.notifications || []);
//     setUnreadCount(data.unreadCount || 0);
//   }, []);

//   const markRead = useCallback(
//     async (id) => {
//       await markNotificationRead(id);
//       await refresh();
//     },
//     [refresh]
//   );

//   useEffect(() => {
//     refresh();
//     const timer = setInterval(refresh, 15000);
//     return () => clearInterval(timer);
//   }, [refresh]);

//   return { notifications, unreadCount, refresh, markRead };
// }

export async function searchResourcesByQuery(query) {
  const data = await searchResources(query);
  return data.resources || [];
}
