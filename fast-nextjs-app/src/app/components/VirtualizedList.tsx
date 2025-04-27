import React from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

const VirtualizedList = <T,>({
  items,
  itemHeight,
  renderItem,
  className = '',
  overscan = 3,
}: VirtualizedListProps<T>) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) {
      return null; // Skip rendering if item is undefined
    }
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={overscan}
    >
      {Row}
    </List>
  );
};

export default VirtualizedList; 