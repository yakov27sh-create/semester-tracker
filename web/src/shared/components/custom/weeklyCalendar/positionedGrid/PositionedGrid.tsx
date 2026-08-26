import type { GridItem, PositionedColumnOptions } from "./PositionedColumn";
import PositionedColumn from "./PositionedColumn";

type PositionedGridOptions = {
  numOfColumns: number;
};

type PositionedGridProps = {
  items: (GridItem & { column: number })[];
  options: PositionedGridOptions;
  columnOptions: PositionedColumnOptions;
  className?: string;
};

function PositionedGrid({
  className,
  items,
  options,
  columnOptions,
}: PositionedGridProps) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.numOfColumns}, 1fr)`,
      }}
    >
      {Array(options.numOfColumns)
        .fill(0)
        .map((_col, index) => (
          <div key={index + 1} style={{ gridColumn: `${index + 1}` }}>
            <PositionedColumn
              items={items.filter((item) => item.column === index + 1) || []}
              options={{
                className: columnOptions.className,
                numOfRows: columnOptions.numOfRows,
                cellClassName: columnOptions.cellClassName,
              }}
            />
          </div>
        ))}
    </div>
  );
}

export default PositionedGrid;
