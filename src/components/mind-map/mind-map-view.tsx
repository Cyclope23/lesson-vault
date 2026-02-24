"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MindMapData, MindMapNode } from "@/types/lesson";
import { svgToPngBlob } from "./export-utils";

// ───── Layout constants ─────

const NODE_H = 40;
const NODE_PAD_X = 20;
const NODE_PAD_Y = 14;
const LEVEL_GAP = 180;
const SIBLING_GAP = 12;
const FONT_SIZE = 13;
const ROOT_FONT_SIZE = 15;
const CHAR_WIDTH = 7.5; // approximate px per char at 13px
const ROOT_CHAR_WIDTH = 8.5;
const COLLAPSE_RADIUS = 8;

const DEFAULT_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

// ───── Layout types ─────

interface LayoutNode {
  id: string;
  label: string;
  description?: string;
  explanation?: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  children: LayoutNode[];
  collapsed: boolean;
  parent?: LayoutNode;
}

// ───── Layout algorithm ─────

function measureNodeWidth(label: string, depth: number): number {
  const cw = depth === 0 ? ROOT_CHAR_WIDTH : CHAR_WIDTH;
  return Math.max(80, label.length * cw + NODE_PAD_X * 2);
}

function assignColors(node: MindMapNode, parentColor: string, depth: number, branchIndex: number): string {
  if (node.color) return node.color;
  if (depth === 0) return "#1E40AF";
  if (depth === 1) return DEFAULT_COLORS[branchIndex % DEFAULT_COLORS.length];
  return parentColor;
}

function buildLayoutTree(
  node: MindMapNode,
  depth: number,
  collapsedSet: Set<string>,
  parentColor: string,
  branchIndex: number,
): LayoutNode {
  const color = assignColors(node, parentColor, depth, branchIndex);
  const width = measureNodeWidth(node.label, depth);
  const collapsed = collapsedSet.has(node.id);
  const children =
    collapsed || !node.children
      ? []
      : node.children.map((child, i) =>
          buildLayoutTree(child, depth + 1, collapsedSet, color, depth === 0 ? i : branchIndex),
        );

  return {
    id: node.id,
    label: node.label,
    description: node.description,
    explanation: node.explanation,
    color,
    x: 0,
    y: 0,
    width,
    height: NODE_H,
    depth,
    children,
    collapsed: collapsed && (node.children?.length ?? 0) > 0,
  };
}

/** Returns the total subtree height consumed by a node. */
function subtreeHeight(node: LayoutNode): number {
  if (node.children.length === 0) return node.height;
  const childrenH = node.children.reduce(
    (sum, c) => sum + subtreeHeight(c),
    0,
  );
  return Math.max(node.height, childrenH + SIBLING_GAP * (node.children.length - 1));
}

function positionTree(node: LayoutNode, x: number, yStart: number): void {
  const totalH = subtreeHeight(node);
  node.x = x;

  if (node.children.length === 0) {
    node.y = yStart + totalH / 2 - node.height / 2;
    return;
  }

  // Position children
  let childY = yStart;
  for (const child of node.children) {
    const ch = subtreeHeight(child);
    positionTree(child, x + node.width + LEVEL_GAP, childY);
    childY += ch + SIBLING_GAP;
  }

  // Center parent on children
  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  const midY =
    (firstChild.y + firstChild.height / 2 + lastChild.y + lastChild.height / 2) / 2;
  node.y = midY - node.height / 2;
}

function collectNodes(node: LayoutNode, list: LayoutNode[] = []): LayoutNode[] {
  list.push(node);
  for (const c of node.children) collectNodes(c, list);
  return list;
}

function hasChildren(nodeId: string, data: MindMapData): boolean {
  function find(n: MindMapNode): MindMapNode | null {
    if (n.id === nodeId) return n;
    for (const c of n.children || []) {
      const found = find(c);
      if (found) return found;
    }
    return null;
  }
  const n = find(data.root);
  return (n?.children?.length ?? 0) > 0;
}

// ───── SVG rendering ─────

export interface MindMapViewHandle {
  getSvgElement: () => SVGSVGElement | null;
}

interface MindMapViewProps {
  data: MindMapData;
}

export const MindMapView = forwardRef<MindMapViewHandle, MindMapViewProps>(
  function MindMapView({ data }, ref) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [collapsedSet, setCollapsedSet] = useState<Set<string>>(() => {
      // Default: collapse depth >= 2
      const set = new Set<string>();
      function walk(node: MindMapNode, depth: number) {
        if (depth >= 2 && node.children?.length) {
          set.add(node.id);
        }
        for (const c of node.children || []) walk(c, depth + 1);
      }
      walk(data.root, 0);
      return set;
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    useImperativeHandle(ref, () => ({
      getSvgElement: () => svgRef.current,
    }));

    const toggleCollapse = useCallback(
      (nodeId: string) => {
        setCollapsedSet((prev) => {
          const next = new Set(prev);
          if (next.has(nodeId)) next.delete(nodeId);
          else next.add(nodeId);
          return next;
        });
      },
      [],
    );

    // Build layout
    const { root, allNodes, viewBox } = useMemo(() => {
      const root = buildLayoutTree(data.root, 0, collapsedSet, "", 0);
      const margin = 40;
      positionTree(root, margin, margin);
      const all = collectNodes(root);

      let maxX = 0;
      let maxY = 0;
      for (const n of all) {
        maxX = Math.max(maxX, n.x + n.width);
        maxY = Math.max(maxY, n.y + n.height);
      }

      return {
        root,
        allNodes: all,
        viewBox: `0 0 ${maxX + margin} ${maxY + margin}`,
      };
    }, [data, collapsedSet]);

    // Find selected node description
    const selectedNode = selectedId
      ? allNodes.find((n) => n.id === selectedId)
      : null;

    async function handleExportPng() {
      if (!svgRef.current) return;
      setExporting(true);
      try {
        const blob = await svgToPngBlob(svgRef.current);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mappa-concettuale.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        toast.error("Errore nell'esportazione PNG");
      } finally {
        setExporting(false);
      }
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Mappa concettuale</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Scarica PNG
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto border-t" style={{ maxHeight: 600 }}>
            <svg
              ref={svgRef}
              viewBox={viewBox}
              className="min-w-full"
              style={{ minHeight: 300 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Connections */}
              {allNodes.map((node) =>
                node.children.map((child) => {
                  const x1 = node.x + node.width;
                  const y1 = node.y + node.height / 2;
                  const x2 = child.x;
                  const y2 = child.y + child.height / 2;
                  const cx = (x1 + x2) / 2;
                  return (
                    <path
                      key={`edge-${node.id}-${child.id}`}
                      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={child.color}
                      strokeWidth={2}
                      opacity={0.5}
                    />
                  );
                }),
              )}

              {/* Cross-links (dashed) */}
              {data.crossLinks?.map((link, i) => {
                const from = allNodes.find((n) => n.id === link.fromId);
                const to = allNodes.find((n) => n.id === link.toId);
                if (!from || !to) return null;
                const x1 = from.x + from.width / 2;
                const y1 = from.y + from.height;
                const x2 = to.x + to.width / 2;
                const y2 = to.y;
                const midY = (y1 + y2) / 2;
                return (
                  <g key={`cross-${i}`}>
                    <path
                      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      opacity={0.6}
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={midY - 4}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#6B7280"
                    >
                      {link.label}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {allNodes.map((node) => {
                const isRoot = node.depth === 0;
                const isSelected = node.id === selectedId;
                const canCollapse = hasChildren(node.id, data);
                const fontSize = isRoot ? ROOT_FONT_SIZE : FONT_SIZE;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
                  >
                    {/* Node rect */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx={isRoot ? 10 : 6}
                      fill={isRoot ? node.color : "#FFFFFF"}
                      stroke={node.color}
                      strokeWidth={isSelected ? 3 : isRoot ? 2.5 : 1.5}
                    />
                    {/* Node label */}
                    <text
                      x={node.x + node.width / 2}
                      y={node.y + node.height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fontSize}
                      fontWeight={isRoot ? 700 : 500}
                      fill={isRoot ? "#FFFFFF" : "#1F2937"}
                    >
                      {node.label}
                    </text>

                    {/* Collapse/expand indicator */}
                    {canCollapse && (
                      <g
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapse(node.id);
                        }}
                      >
                        <circle
                          cx={node.x + node.width + COLLAPSE_RADIUS + 4}
                          cy={node.y + node.height / 2}
                          r={COLLAPSE_RADIUS}
                          fill="#F3F4F6"
                          stroke={node.color}
                          strokeWidth={1.5}
                        />
                        <text
                          x={node.x + node.width + COLLAPSE_RADIUS + 4}
                          y={node.y + node.height / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                          fontWeight={700}
                          fill={node.color}
                        >
                          {node.collapsed ? "+" : "−"}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Detail panel — shown on node click */}
          {selectedNode && (selectedNode.description || selectedNode.explanation) && (
            <div className="border-t bg-muted/30 px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <h3 className="font-semibold text-sm">{selectedNode.label}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedId(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              {selectedNode.description && (
                <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
              )}
              {selectedNode.explanation && (
                <>
                  <Separator />
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:bg-muted prose-pre:text-foreground">
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {selectedNode.explanation}
                    </Markdown>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
