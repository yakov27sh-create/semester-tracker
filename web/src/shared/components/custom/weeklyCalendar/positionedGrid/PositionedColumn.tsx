import type { ReactNode } from "react";
import positionItems from "./position-items";
import { motion } from "framer-motion";

export type GridItem = {
  item: ReactNode;
  id: string | number;
  row: number;
  rowSpan: number;
};

export type PositionedColumnOptions = {
  numOfRows: number;
  className?: string;
  cellClassName?: string;
};

export type PositionedColumnProps = {
  items: GridItem[];
  options: PositionedColumnOptions;
};

function PositionedColumn({ items, options }: PositionedColumnProps) {
  if (items.length === 0) return null;
  const numOfRows = options.numOfRows;

  const clusters = positionItems(
    items.map((item) => {
      return {
        id: item.id,
        gridRowStart: item.row,
        gridRowEnd: item.row + item.rowSpan,
      };
    }),
    numOfRows + 1,
  );

  const byId = Object.groupBy(items, (i) => i.id);
  return (
    <div
      className={`${options.className}`}
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${numOfRows}, 1fr)`,
        gridTemplateColumns: "1fr",
      }}
    >
      {clusters.map((cluster) => (
        <div
          key={cluster.clusterId}
          style={{
            gridRowStart: cluster.gridRowStart,
            gridRowEnd: cluster.gridRowEnd,
            display: "grid",
            gridTemplateRows: "subgrid",
          }}
        >
          {cluster.items.map((item) => {
            return (
              <motion.div
                key={`${item.id}-${item.columnStart}-${item.columnEnd}`}
                className={options.cellClassName}
                style={{
                  gridRowStart: item.gridRowStart,
                  gridRowEnd: item.gridRowEnd,
                  gridColumnStart: item.columnStart,
                  gridColumnEnd: item.columnEnd,
                }}
              >
                {byId[item.id]![0].item}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default PositionedColumn;
