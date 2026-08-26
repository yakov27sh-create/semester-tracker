import { useEffect, useRef, useState } from "react";
type GridBackgroundProps = {
  className: string;
  numberOfRows: number;
  numberOfColumns: number;
};

function GridBackground({
  className = "",
  numberOfRows = 25,
  numberOfColumns = 5,
}: GridBackgroundProps) {
  const bgRef = useRef<HTMLDivElement | null>(null);
  const [rowHeight, setRowHeight] = useState(0);
  const [colWidth, setColWidth] = useState(0);

  useEffect(() => {
    if (!bgRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!bgRef.current) return;
      const scrollHeight = bgRef.current?.scrollHeight;
      const scrollWidth = bgRef.current?.scrollWidth;
      setRowHeight(scrollHeight / numberOfRows);
      setColWidth(scrollWidth / numberOfColumns);
    });

    observer.observe(bgRef.current);
    return () => {
      observer.disconnect();
    };
  }, [numberOfColumns, numberOfRows]);

  const lineColorStart = "var(--primary)";
  const lineColorBetween = "var(--primary)";
  const columnLineColor = "var(--primary)";
  const startRowColor = "transparent";
  const nextRowColor = "transparent";

  const lineWidth = "1px";

  const backgroundStyle = {
    backgroundImage: `
			repeating-linear-gradient(
				to left,
				
				transparent 0px,
				transparent calc(${colWidth}px - ${lineWidth})
			),

			repeating-linear-gradient(
				to bottom,

				${nextRowColor} 0px,

				${startRowColor} 4px,
				${startRowColor} ${rowHeight - 4}px,

				${startRowColor} ${rowHeight + 4}px,
				${startRowColor} ${2 * rowHeight - 4}px,

				${nextRowColor} ${2 * rowHeight + 4}px,
				${nextRowColor} ${3 * rowHeight - 4}px,

				${nextRowColor} ${3 * rowHeight + 4}px,
				${nextRowColor} ${4 * rowHeight}px

			) 
		`,
  };

  const lines = {
    backgroundImage: `
			repeating-linear-gradient(
				to left,
				
				${columnLineColor} 0px,
				${columnLineColor} ${lineWidth},

				transparent ${lineWidth},
				transparent calc(${colWidth}px - ${lineWidth}),

				${columnLineColor} ${colWidth}px
			),

			repeating-linear-gradient(
				to bottom,

				${lineColorStart} 0px,
				${lineColorStart} ${lineWidth},

				transparent ${lineWidth},
				transparent calc(${rowHeight}px -  ${lineWidth}),

				${lineColorBetween} calc(${rowHeight}px - ${lineWidth}),
				${lineColorBetween} ${rowHeight}px,

				transparent calc(${rowHeight}px),
				transparent calc(${2 * rowHeight}px)
			) 
		`,
  };
  return (
    <div className={`${className}`}>
      <div className="h-full w-full overflow-hidden relative starting:opacity-0 opacity-100 transition-all">
        <div
          ref={bgRef}
          className="absolute inset-0"
          style={{ ...backgroundStyle, imageRendering: "pixelated" }}
        ></div>
        
        <div
          className="absolute inset-0 "
          style={{ ...lines, imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

export default GridBackground;
