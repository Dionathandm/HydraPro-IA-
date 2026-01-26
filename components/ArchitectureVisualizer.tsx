import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ArchitectureVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .html('');

    const nodes = [
      { id: 'CORE', type: 'central', label: 'HYDRA_CORE' },
      { id: 'BUILDER', type: 'agent', label: 'BUILDER' },
      { id: 'SECURITY', type: 'agent', label: 'SECURITY' },
      { id: 'PERFORMANCE', type: 'agent', label: 'PERFORMANCE' },
      { id: 'ORGANIZER', type: 'agent', label: 'ORGANIZER' },
      { id: 'OWNER', type: 'module', label: 'DIONATHAN' }
    ];

    const links = [
      { source: 'CORE', target: 'BUILDER' },
      { source: 'CORE', target: 'SECURITY' },
      { source: 'CORE', target: 'PERFORMANCE' },
      { source: 'CORE', target: 'ORGANIZER' },
      { source: 'CORE', target: 'OWNER' }
    ];

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', 'rgba(16, 185, 129, 0.2)')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('circle')
      .attr('r', (d: any) => d.type === 'central' ? 28 : 14)
      .attr('fill', (d: any) => d.type === 'central' ? '#10b981' : '#050a08')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))');

    node.append('text')
      .text((d: any) => d.label)
      .attr('dx', 35)
      .attr('dy', 5)
      .attr('fill', '#fff')
      .style('font-size', '11px')
      .style('font-weight', '900')
      .style('font-family', 'JetBrains Mono')
      .style('letter-spacing', '0.1em');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, []);

  return (
    <div ref={containerRef} className="glass rounded-[2rem] overflow-hidden border border-emerald-500/10 h-[400px] relative w-full">
      <div className="absolute top-6 left-6 pointer-events-none">
        <h3 className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase mb-1">Mapa de Arquitetura</h3>
        <p className="text-[9px] text-white/30 uppercase font-black">Conexões neurais do núcleo Hydra</p>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default ArchitectureVisualizer;