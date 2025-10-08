import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { useIsMobile } from '../hooks/useMediaQuery';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number;
}

function VirtualList<T>({ items, itemHeight, renderItem, height }: VirtualListProps<T>) {
  const isMobile = useIsMobile();
  
  // Calculate height based on viewport
  const listHeight = height || (isMobile ? window.innerHeight - 200 : 600);

  // Don't use virtual scrolling for small lists
  if (items.length < 50) {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{renderItem(items[index], index)}</div>
  );

  return (
    <List
      height={listHeight}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      className="smooth-scroll"
    >
      {Row}
    </List>
  );
}

export default VirtualList;
