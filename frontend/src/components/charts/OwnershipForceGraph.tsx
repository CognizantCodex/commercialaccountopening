import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/Card';
import type { CaseRecord } from '@/types/platform';

type SimulatedNode = d3.SimulationNodeDatum & CaseRecord['ownershipGraph']['nodes'][number];
type SimulatedLink = d3.SimulationLinkDatum<SimulatedNode> & CaseRecord['ownershipGraph']['links'][number];
type RenderNode = CaseRecord['ownershipGraph']['nodes'][number] & { x: number; y: number };
type RenderLink = {
  key: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  weight: number;
};

const groupColor = {
  client: 'var(--accent)',
  'beneficial-owner': 'var(--accent-secondary)',
  advisor: 'var(--warning)',
  jurisdiction: 'var(--success)',
};

export function OwnershipForceGraph({
  graph,
}: {
  graph: CaseRecord['ownershipGraph'];
}) {
  const [nodes, setNodes] = useState<RenderNode[]>([]);
  const [links, setLinks] = useState<RenderLink[]>([]);

  useEffect(() => {
    const localNodes: SimulatedNode[] = graph.nodes.map((node) => ({ ...node }));
    const localLinks: SimulatedLink[] = graph.links.map((link) => ({ ...link }));

    const simulation = d3
      .forceSimulation(localNodes)
      .force('charge', d3.forceManyBody().strength(-160))
      .force('center', d3.forceCenter(180, 140))
      .force(
        'link',
        d3
          .forceLink(localLinks)
          .id((node) => (node as SimulatedNode).id)
          .distance(78),
      )
      .force('collision', d3.forceCollide(26))
      .stop();

    for (let tick = 0; tick < 120; tick += 1) {
      simulation.tick();
    }

    setNodes(
      localNodes.map((node) => ({
        ...node,
        x: node.x ?? 0,
        y: node.y ?? 0,
      })),
    );
    setLinks(
      localLinks.map((link, index) => {
        const source = link.source as SimulatedNode;
        const target = link.target as SimulatedNode;

        return {
          key: `${source.id}-${target.id}-${index}`,
          sourceX: source.x ?? 0,
          sourceY: source.y ?? 0,
          targetX: target.x ?? 0,
          targetY: target.y ?? 0,
          weight: link.weight,
        };
      }),
    );
  }, [graph]);

  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">Ownership graph</h3>
      <svg viewBox="0 0 360 280" className="mt-4 h-[20rem] w-full">
        {links.map((link, index) => (
          <line
            key={`${link.key}-${index}`}
            x1={link.sourceX}
            y1={link.sourceY}
            x2={link.targetX}
            y2={link.targetY}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={Math.max(link.weight / 18, 1.5)}
          />
        ))}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}>
            <circle r="20" fill={groupColor[node.group]} opacity="0.9" />
            <circle r="23" fill="transparent" stroke="rgba(255,255,255,0.2)" />
            <text
              x="0"
              y="36"
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize="11"
              fontWeight="600"
            >
              {node.name}
            </text>
            <text x="0" y="50" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
              {node.role}
            </text>
          </g>
        ))}
      </svg>
    </Card>
  );
}
