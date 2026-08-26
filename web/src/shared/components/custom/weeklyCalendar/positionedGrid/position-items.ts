type ItemId = string | number;

export type Item = {
  id: ItemId;
  gridRowStart: number;
  gridRowEnd: number;
};

export type PositionedItem = Item & { columnStart: number; columnEnd: number };
export type Cluster = { items: Item[]; clusterId: string };
export type PositionedCluster = {
  items: PositionedItem[];
  gridRowStart: number;
  gridRowEnd: number;
  clusterId: string;
};

function positionItems(items: Item[], numOfRows: number) {
  // Handle edge case
  if (items.length === 0) {
    if (numOfRows > 1) {
      return [makeEmptyCluster(1, numOfRows)];
    }
    return [];
  }

  const sorted = [...items].sort((a, b) => a.gridRowStart - b.gridRowStart);
  const clusters = groupOverlapClusters(sorted);
  clusters.sort((a, b) => a.items[0].gridRowStart - b.items[0].gridRowStart);

  const positionedClusters: PositionedCluster[] = [];
  let prevEndRow = 1;

  for (const cluster of clusters) {
    const positionedCluster = positionCluster(cluster);

    // Check for a gap before adding the current cluster
    if (positionedCluster.gridRowStart > prevEndRow) {
      const emptyCluster = makeEmptyCluster(
        prevEndRow,
        positionedCluster.gridRowStart,
      );
      positionedClusters.push(emptyCluster);
    }

    // add the positioned cluster
    positionedClusters.push(positionedCluster);
    prevEndRow = positionedCluster.gridRowEnd;
  }

  // Add the final empty cluster if needed
  if (prevEndRow < numOfRows) {
    positionedClusters.push(makeEmptyCluster(prevEndRow, numOfRows));
  }

  return positionedClusters;
}

function makeEmptyCluster(start: number, end: number) {
  return {
    items: [],
    gridRowStart: start,
    gridRowEnd: end,
    clusterId: `empty-${start}-${end}`,
  };
}

export default positionItems;

export function positionCluster(cluster: Cluster): PositionedCluster {
  const sorted = {
    items: [...cluster.items].sort((a, b) => a.gridRowStart - b.gridRowStart),
    clusterId: cluster.clusterId,
  };

  const clusterRowStart = sorted.items[0].gridRowStart;

  const clusterRowEnd = Math.max(
    ...sorted.items.map((item) => item.gridRowEnd),
  );

  const offset = clusterRowStart;
  const positionedItems: PositionedItem[] = [];
  const heads: (ItemId | null)[] = [];
  const endRowMap = new Map<ItemId, number>();

  for (const item of sorted.items) {
    const positionedItem: PositionedItem = {
      ...item,
      gridRowStart: item.gridRowStart - offset + 1,
      gridRowEnd: item.gridRowEnd - offset + 1,
      columnStart: 0,
      columnEnd: 0,
    };

    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      if (h != null && endRowMap.get(h)! <= positionedItem.gridRowStart)
        heads[i] = null;
    }

    const gap = findWidestGap(heads);
    if (!gap) {
      positionedItem.columnStart = heads.length;
      positionedItem.columnEnd = heads.length + 1;
      heads.push(positionedItem.id);
    } else {
      positionedItem.columnStart = gap[0];
      positionedItem.columnEnd = gap[1];

      for (let i = gap[0]; i < gap[1]; i++) {
        heads[i] = positionedItem.id;
      }
    }
    positionedItems.push(positionedItem);
    endRowMap.set(positionedItem.id, positionedItem.gridRowEnd);
  }

  return {
    items: positionedItems,
    gridRowStart: clusterRowStart,
    gridRowEnd: clusterRowEnd,
    clusterId: cluster.clusterId,
  };
}
export function findWidestGap(arr: (ItemId | null)[]): [number, number] | null {
  let widestGapEdges: [number, number] | null = null;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] != null) {
      continue;
    } else {
      const gapStart = i;
      let gapEnd = i;
      while (arr[i] === null) {
        gapEnd = i + 1;
        if (
          !widestGapEdges ||
          gapEnd - gapStart > widestGapEdges[1] - widestGapEdges[0]
        ) {
          widestGapEdges = [gapStart, gapEnd];
        }
        i++;
      }
    }
  }

  return widestGapEdges;
}

export function areOverlapping(
  a: Pick<Item, "gridRowStart" | "gridRowEnd">,
  b: Pick<Item, "gridRowStart" | "gridRowEnd">,
) {
  return (
    (a.gridRowStart <= b.gridRowStart && a.gridRowEnd > b.gridRowStart) ||
    (b.gridRowStart <= a.gridRowStart && b.gridRowEnd > a.gridRowStart)
  );
}

export function groupOverlapClusters(items: Item[]): Cluster[] {
  if (items.length === 0) {
    return [];
  }

  const clusters: Cluster[] = [];

  let currentCluster: Cluster = {
    items: [items[0]],
    clusterId: `${0}-${items[0].gridRowStart}-${items[0].gridRowEnd}`,
  };

  let clusterMaxEnd = items[0].gridRowEnd;

  for (let i = 1; i < items.length; i++) {
    const item = items[i];

    // Check if the item starts before the current cluster's max end time
    if (item.gridRowStart < clusterMaxEnd) {
      // It they overlaps, add it to the cluster
      currentCluster.items.push(item);
      // Update the cluster's max end time
      clusterMaxEnd = Math.max(clusterMaxEnd, item.gridRowEnd);
    } else {
      // No overlap, this item starts a new cluster
      // Push the full cluster
      clusters.push(currentCluster);
      // Create the new one
      currentCluster = {
        items: [item],
        clusterId: `${i}-${item.gridRowStart}-${item.gridRowEnd}`,
      };
      clusterMaxEnd = item.gridRowEnd;
    }
  }

  clusters.push(currentCluster);

  return clusters;
}
