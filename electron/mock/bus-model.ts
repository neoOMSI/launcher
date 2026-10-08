import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type Vec3 = [number, number, number];

interface Part {
  min: Vec3;
  max: Vec3;
  colour: Vec3;
  metal?: number;
  rough?: number;
}

function hash(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function paintColour(paint: string): Vec3 {
  const hue = (hash(paint) % 360) / 360;
  const s = 0.5;
  const l = 0.55;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    const x = (t + 1) % 1;
    const v =
      x < 1 / 6 ? p + (q - p) * 6 * x : x < 0.5 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p;
    return v ** 2.2;
  };
  return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)];
}

function parts(paint: string): Part[] {
  const body = paintColour(paint);
  const glass: Vec3 = [0.02, 0.025, 0.03];
  const rubber: Vec3 = [0.02, 0.02, 0.02];
  const wheels = [-3.2, 4.1].flatMap((x) =>
    [-1, 1].map((side): Part => ({
      min: [x - 0.5, 0, side > 0 ? 1.0 : -1.3],
      max: [x + 0.5, 1.0, side > 0 ? 1.3 : -1.0],
      colour: rubber,
      rough: 0.9,
    })),
  );
  return [
    { min: [-6, 0.35, -1.27], max: [6, 3.0, 1.27], colour: body, rough: 0.45 },
    { min: [-5.7, 1.45, -1.285], max: [5.7, 2.6, 1.285], colour: glass, metal: 0.5, rough: 0.12 },
    { min: [5.9, 1.1, -1.15], max: [6.02, 2.8, 1.15], colour: glass, metal: 0.5, rough: 0.12 },
    { min: [-5.6, 3.0, -1.1], max: [5.6, 3.12, 1.1], colour: [0.6, 0.6, 0.62], rough: 0.6 },
    { min: [-6.03, 0.35, -1.2], max: [6.03, 0.6, 1.2], colour: [0.05, 0.05, 0.05], rough: 0.7 },
    ...wheels,
  ];
}

function boxGeometry({ min, max }: Part) {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3;
    const c = (a + 2) % 3;
    for (const s of [1, -1]) {
      const base = positions.length / 3;
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        const p: Vec3 = [0, 0, 0];
        p[a] = s > 0 ? max[a] : min[a];
        p[b] = u ? max[b] : min[b];
        p[c] = v ? max[c] : min[c];
        const n: Vec3 = [0, 0, 0];
        n[a] = s;
        positions.push(...p);
        normals.push(...n);
      }
      indices.push(...(s > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]).map((i) => base + i));
    }
  }
  return { positions, normals, indices };
}

function glb(paint: string) {
  const chunks: Buffer[] = [];
  let offset = 0;
  const bufferViews: object[] = [];
  const accessors: object[] = [];
  const add = (data: Buffer, target: number) => {
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, target });
    const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
    chunks.push(padded);
    offset += padded.length;
    return bufferViews.length - 1;
  };

  const meshes = parts(paint).map((part, i) => {
    const g = boxGeometry(part);
    const pos = add(Buffer.from(new Float32Array(g.positions).buffer), 34962);
    accessors.push({
      bufferView: pos,
      componentType: 5126,
      count: g.positions.length / 3,
      type: 'VEC3',
      min: part.min,
      max: part.max,
    });
    const nrm = add(Buffer.from(new Float32Array(g.normals).buffer), 34962);
    accessors.push({
      bufferView: nrm,
      componentType: 5126,
      count: g.normals.length / 3,
      type: 'VEC3',
    });
    const idx = add(Buffer.from(new Uint16Array(g.indices).buffer), 34963);
    accessors.push({
      bufferView: idx,
      componentType: 5123,
      count: g.indices.length,
      type: 'SCALAR',
    });
    const first = accessors.length - 3;
    return {
      primitives: [
        { attributes: { POSITION: first, NORMAL: first + 1 }, indices: first + 2, material: i },
      ],
    };
  });

  const json = {
    asset: { version: '2.0', generator: 'neoOMSI launcher mock' },
    scene: 0,
    scenes: [{ nodes: meshes.map((_, i) => i) }],
    nodes: meshes.map((_, i) => ({ mesh: i })),
    meshes,
    materials: parts(paint).map((part) => ({
      pbrMetallicRoughness: {
        baseColorFactor: [...part.colour, 1],
        metallicFactor: part.metal ?? 0,
        roughnessFactor: part.rough ?? 0.5,
      },
    })),
    buffers: [{ byteLength: offset }],
    bufferViews,
    accessors,
  };

  let text = Buffer.from(JSON.stringify(json));
  text = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)]);
  const bin = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + text.length + 8 + bin.length, 8);
  const chunk = (data: Buffer, type: number) => {
    const head = Buffer.alloc(8);
    head.writeUInt32LE(data.length, 0);
    head.writeUInt32LE(type, 4);
    return Buffer.concat([head, data]);
  };
  return Buffer.concat([header, chunk(text, 0x4e4f534a), chunk(bin, 0x004e4942)]);
}

export async function mockBusModel(paint: string) {
  const path = join(tmpdir(), `neoomsi-mock-bus-${hash(paint).toString(16)}.glb`);
  await writeFile(path, glb(paint));
  return path;
}
