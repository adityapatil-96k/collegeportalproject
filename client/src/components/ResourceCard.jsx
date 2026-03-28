import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Bookmark, BookmarkCheck } from 'lucide-react';
import { trackDownload } from '../services/api';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso || '';
  }
}

export function ResourceCard({ resource, isBookmarked, onToggleBookmark }) {
  const title = resource?.title || '(Untitled)';
  const subject = resource?.subject || '—';
  const uploader = resource?.uploadedBy?.name || 'Unknown';
  const date = fmtDate(resource?.createdAt);
  const url = resource?._id ? `/resources/${resource._id}/view` : resource?.fileUrl;

  const openView = (e) => {
    e.stopPropagation();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onDownload = async (e) => {
    e.stopPropagation();
    if (!url) return;
    if (resource?._id) {
      try {
        await trackDownload(resource._id);
      } catch (err) {
        console.error('Download tracking failed:', err);
      }
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: 1.05,
        zIndex: 10,
        transition: { duration: 0.2 }
      }}
      className="relative flex-shrink-0 w-64 h-80 glass rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300"
      onClick={openView}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
      
      {/* Icon/Thumbnail Area */}
      <div className="absolute inset-0 flex items-center justify-center -translate-y-8 group-hover:-translate-y-12 transition-transform duration-300">
        <div className="p-4 rounded-full bg-accent-start/20 border border-accent-start/30">
          <FileText className="w-12 h-12 text-accent-start" />
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-accent-start transition-colors">
            {title}
          </h3>
          <p className="text-xs font-medium text-accent-start uppercase tracking-wider">
            {subject}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <button
              onClick={openView}
              className="p-2 rounded-lg bg-white/10 hover:bg-accent-start/20 text-white hover:text-accent-start transition-all"
              title="View PDF"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={onDownload}
              className="p-2 rounded-lg bg-white/10 hover:bg-accent-start/20 text-white hover:text-accent-start transition-all"
              title="Download"
            >
              <Download size={18} />
            </button>
          </div>
          
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(resource._id);
              }}
              className={`p-2 rounded-lg transition-all ${
                isBookmarked 
                  ? 'bg-accent-start/20 text-accent-start' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
            >
              {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
          )}
        </div>

        <div className="text-[10px] text-muted flex justify-between items-center opacity-60 group-hover:opacity-100">
          <span>{uploader}</span>
          <span>{date}</span>
        </div>
      </div>
    </motion.div>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    subject: PropTypes.string,
    createdAt: PropTypes.string,
    fileUrl: PropTypes.string,
    uploadedBy: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
  isBookmarked: PropTypes.bool,
  onToggleBookmark: PropTypes.func,
};
