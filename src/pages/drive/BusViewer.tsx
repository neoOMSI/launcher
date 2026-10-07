import React, { useEffect, useRef, useState } from 'react';
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Icon } from '../../components/Icon';
import { t } from '../../i18n';
import { errorText } from '../../lib/engine';

const models = new Map<string, Promise<Uint8Array>>();

function model(bus: string, paint: string) {
  const key = `${bus}|${paint}`;
  let pending = models.get(key);
  if (!pending) {
    pending = window.neoomsi.previewModel(bus, paint);
    pending.catch(() => models.delete(key));
    models.set(key, pending);
  }
  return pending;
}

function dispose(root: Object3D) {
  root.traverse((o) => {
    const mesh = o as Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of materials) {
      if (!m) continue;
      for (const value of Object.values(m)) {
        if (value && typeof value === 'object' && 'isTexture' in value) value.dispose();
      }
      m.dispose();
    }
  });
}

export const BusViewer: React.FC<{ bus: string; paint: string }> = ({ bus, paint }) => {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<{ scene: Scene; place: (o: Object3D) => void } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | string>('loading');

  useEffect(() => {
    const el = host.current!;
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new HemisphereLight(0xffffff, 0x3a2414, 1.1));
    const sun = new DirectionalLight(0xfff2e0, 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 6;
    scene.add(sun);
    const floor = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({ opacity: 0.35 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const camera = new PerspectiveCamera(30, 1, 0.1, 500);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    let current: Object3D | null = null;
    const place = (object: Object3D) => {
      if (current) {
        scene.remove(current);
        dispose(current);
      }
      current = object;
      object.traverse((o) => {
        if ((o as Mesh).isMesh) o.castShadow = true;
      });
      const box = new Box3().setFromObject(object);
      const size = box.getSize(new Vector3());
      const centre = box.getCenter(new Vector3());
      object.position.sub(new Vector3(centre.x, box.min.y, centre.z));
      scene.add(object);

      const radius = size.length() / 2;
      floor.scale.setScalar(radius * 6);
      sun.position.set(radius * 1.2, radius * 2.4, radius * 1.6);
      const cam = sun.shadow.camera;
      cam.left = cam.bottom = -radius * 1.5;
      cam.right = cam.top = radius * 1.5;
      cam.far = radius * 8;
      cam.updateProjectionMatrix();

      const long = size.x >= size.z ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1);
      const side = long.x ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
      const distance = (radius / Math.sin((camera.fov * Math.PI) / 360)) * 0.8;
      camera.position
        .copy(side.multiplyScalar(distance * 0.7))
        .add(long.multiplyScalar(distance * 0.78))
        .setY(size.y * 1.15);
      controls.target.set(0, size.y * 0.38, 0);
      controls.minDistance = radius * 1.2;
      controls.maxDistance = radius * 4;
      controls.update();
    };
    view.current = { scene, place };

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      if (current) dispose(current);
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    let live = true;
    setState('loading');
    model(bus, paint)
      .then(
        (bytes) =>
          new Promise<Object3D>((resolve, reject) =>
            new GLTFLoader().parse(
              bytes.buffer.slice(
                bytes.byteOffset,
                bytes.byteOffset + bytes.byteLength,
              ) as ArrayBuffer,
              '',
              (gltf) => resolve(gltf.scene),
              reject,
            ),
          ),
      )
      .then((object) => {
        if (!live || !view.current) return dispose(object);
        view.current.place(object);
        setState('ready');
      })
      .catch((err) => live && setState(errorText(err)));
    return () => {
      live = false;
    };
  }, [bus, paint]);

  return (
    <div className="relative size-full">
      <div
        ref={host}
        className={`size-full cursor-grab transition-opacity duration-500 active:cursor-grabbing ${
          state === 'ready' ? 'opacity-100' : 'opacity-30'
        }`}
      />
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          {state === 'loading' ? (
            <>
              <span className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
              <span className="text-[15px] text-muted">{t('drive.preview.loading')}</span>
            </>
          ) : (
            <>
              <Icon name="directions_bus" size={40} style={{ color: 'var(--line-strong)' }} />
              <span className="max-w-[22rem] text-[15px] text-muted">{state}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
