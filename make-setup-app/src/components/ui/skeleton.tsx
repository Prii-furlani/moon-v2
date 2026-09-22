import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  borderRadius,
  style,
  ...props
}) => {
  return (
    <div
      className={cn("skeleton", className)}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="moon-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Skeleton width="2.5rem" height="2.5rem" borderRadius="50%" />
        <Skeleton width="60%" height="1.25rem" />
      </div>
      <div style={{ padding: '0.5rem 0' }}>
        <Skeleton width="80%" height="2rem" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="40%" height="0.875rem" />
        <Skeleton width="20%" height="1.5rem" borderRadius="9999px" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  const renderRows = () => {
    const arr = [];
    for (let i = 0; i < rows; i++) {
      arr.push(
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Skeleton width="2.5rem" height="2.5rem" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <Skeleton width="70%" height="1rem" />
              <Skeleton width="40%" height="0.75rem" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton width="60%" height="1rem" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Skeleton width="80%" height="1.25rem" />
          </div>
        </div>
      );
    }
    return arr;
  };

  return (
    <div className="moon-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
        <Skeleton width="30%" height="1rem" />
        <Skeleton width="40%" height="1rem" />
        <Skeleton width="20%" height="1rem" style={{ marginLeft: 'auto' }} />
      </div>
      {renderRows()}
    </div>
  );
};

export const HeaderProfileSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Skeleton width="2.5rem" height="2.5rem" borderRadius="50%" />
      <div className="desktop-only" style={{ flexDirection: 'column', gap: '0.35rem' }}>
        <Skeleton width="100px" height="0.875rem" />
        <Skeleton width="140px" height="0.75rem" />
      </div>
    </div>
  );
};
