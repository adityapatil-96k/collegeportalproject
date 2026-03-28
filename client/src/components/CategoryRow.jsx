import PropTypes from 'prop-types';
import { ChevronRight } from 'lucide-react';
import { ResourceCard } from './ResourceCard';

export function CategoryRow({ title, resources, isBookmarked, onToggleBookmark, onSeeAll }) {
  if (!resources || resources.length === 0) return null;

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between px-4 sm:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 group cursor-pointer" onClick={onSeeAll}>
          {title}
          <ChevronRight className="w-6 h-6 text-muted group-hover:text-accent-start transition-colors" />
        </h2>
      </div>

      <div className="relative group">
        <div className="flex overflow-x-auto gap-4 px-4 sm:px-8 pb-6 no-scrollbar scroll-smooth">
          {resources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              isBookmarked={isBookmarked(resource._id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
          <div className="flex-shrink-0 w-4 sm:w-8" />
        </div>
        <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

CategoryRow.propTypes = {
  title: PropTypes.string.isRequired,
  resources: PropTypes.array.isRequired,
  isBookmarked: PropTypes.func.isRequired,
  onToggleBookmark: PropTypes.func.isRequired,
  onSeeAll: PropTypes.func,
};
