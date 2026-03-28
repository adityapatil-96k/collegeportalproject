import PropTypes from 'prop-types';

export function CategoryCard({ title, icon, count, onClick }) {
  return (
    <button className="card category" onClick={onClick} type="button">
      <div className="categoryIcon" aria-hidden="true">
        {icon}
      </div>
      <div className="categoryBody">
        <div className="categoryTitle">{title}</div>
        <div className="categoryMeta">{count ?? 0} available</div>
      </div>
      <div className="categoryChevron" aria-hidden="true">
        ›
      </div>
    </button>
  );
}

CategoryCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func.isRequired,
};

