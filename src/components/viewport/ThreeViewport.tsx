import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  ConfiguratorState,
  SectionId,
} from '../../types/configurator';
import { TENT_SIZES, FRAME_TYPES } from '../../constants/productData';
import { textureCompositor, UV_TILES } from '../../services/textureCompositor';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  Sparkles,
  Camera,
} from 'lucide-react';

export interface ThreeViewportRef {
  exportSnapshot: () => string;
  resetCamera: () => void;
  setPreset: (preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'iso') => void;
}

interface ThreeViewportProps {
  state: ConfiguratorState;
  onSelectSection: (sectionId: SectionId) => void;
  onToggleAutoRotate: () => void;
  onToggleWireframe: () => void;
}

export const ThreeViewport = forwardRef<ThreeViewportRef, ThreeViewportProps>(
  ({ state, onSelectSection, onToggleAutoRotate, onToggleWireframe }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Three.js instances
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const currentModelGroup = useRef<THREE.Group | null>(null);
    const fabricMeshRef = useRef<THREE.Mesh | null>(null);
    const metalMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
    const wallMeshesGroup = useRef<THREE.Group | null>(null);

    const [isLoadingModel, setIsLoadingModel] = useState(true);
    const [hoveredSection, setHoveredSection] = useState<SectionId | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Animation transition variables
    const targetCamPos = useRef<THREE.Vector3 | null>(null);
    const targetLookAt = useRef<THREE.Vector3 | null>(null);

    // Bounding dimensions of the current tent model
    const tentBounds = useRef({
      width: 2.0,
      minY: 0.88,
      yRim: 1.15,
      maxY: 2.12,
    });

    /**
     * Compute and remap UV coordinates on the fabric canopy mesh
     * This creates a planar projection for peaks and valances
     */
    const remapFabricUVs = useCallback((geometry: THREE.BufferGeometry) => {
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox!;
      const minX = bbox.min.x;
      const maxX = bbox.max.x;
      const width = maxX - minX;

      const minY = bbox.min.y;
      const maxY = bbox.max.y;
      const height = maxY - minY;

      // Valance seam rim is roughly bottom 22% of canopy height
      const yRim = minY + height * 0.22;

      tentBounds.current = {
        width,
        minY,
        yRim,
        maxY,
      };

      const posAttr = geometry.attributes.position;
      const uvAttr = geometry.attributes.uv;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);

        const isValance = y < yRim;
        const absX = Math.abs(x);
        const absZ = Math.abs(z);

        let face: 'front' | 'back' | 'right' | 'left' = 'front';
        if (absZ >= absX) {
          face = z > 0 ? 'front' : 'back';
        } else {
          face = x > 0 ? 'right' : 'left';
        }

        const secId: SectionId = `${isValance ? 'valance' : 'peak'}_${face}` as SectionId;
        const tile = UV_TILES[secId];

        let uLocal = 0.5;
        let vLocal = 0.5;

        if (face === 'front') {
          uLocal = (x + width / 2) / width;
        } else if (face === 'back') {
          uLocal = (-x + width / 2) / width;
        } else if (face === 'right') {
          uLocal = (-z + width / 2) / width;
        } else if (face === 'left') {
          uLocal = (z + width / 2) / width;
        }

        uLocal = THREE.MathUtils.clamp(uLocal, 0, 1);

        if (isValance) {
          vLocal = (y - minY) / (yRim - minY);
        } else {
          vLocal = (y - yRim) / (maxY - yRim);
        }
        vLocal = THREE.MathUtils.clamp(vLocal, 0, 1);

        // Map to master texture tile
        const finalU = tile.uMin + uLocal * (tile.uMax - tile.uMin);
        const finalV = tile.vMin + vLocal * (tile.vMax - tile.vMin);

        uvAttr.setXY(i, finalU, finalV);
      }

      uvAttr.needsUpdate = true;
      geometry.computeVertexNormals();
    }, []);

    /**
     * Build or update procedural wall meshes
     */
    const updateWalls = useCallback(
      (wallsConfig: ConfiguratorState['walls'], canopyColor: string) => {
        if (!wallMeshesGroup.current || !sceneRef.current) return;
        const group = wallMeshesGroup.current;

        // Clear existing walls
        while (group.children.length > 0) {
          const child = group.children[0] as THREE.Mesh;
          if (child.geometry) child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
          group.remove(child);
        }

        const { width, yRim } = tentBounds.current;
        const halfW = width * 0.495; // slightly inside frame legs

        const wallMat = new THREE.MeshStandardMaterial({
          color: canopyColor,
          side: THREE.DoubleSide,
          roughness: 0.85,
          metalness: 0.05,
        });

        // 1. Back Wall
        if (wallsConfig.backWall !== 'none') {
          const backWallGeo = new THREE.PlaneGeometry(width * 0.99, yRim);
          const backWallMesh = new THREE.Mesh(backWallGeo, wallMat);
          backWallMesh.position.set(0, yRim / 2, -halfW);
          backWallMesh.name = 'wall_back';
          backWallMesh.castShadow = true;
          backWallMesh.receiveShadow = true;
          group.add(backWallMesh);

          // If window wall, add clear PVC window in center
          if (wallsConfig.backWall === 'window') {
            const windowGeo = new THREE.PlaneGeometry(width * 0.55, yRim * 0.45);
            const windowMat = new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              transmission: 0.85,
              opacity: 0.9,
              transparent: true,
              roughness: 0.1,
              ior: 1.5,
              side: THREE.DoubleSide,
            });
            const windowMesh = new THREE.Mesh(windowGeo, windowMat);
            windowMesh.position.set(0, yRim * 0.55, -halfW + 0.005);
            group.add(windowMesh);
          }
        }

        // 2. Left Wall
        if (wallsConfig.leftWall !== 'none') {
          const isHalf = wallsConfig.leftWall === 'half';
          const wallH = isHalf ? yRim * 0.45 : yRim;
          const leftWallGeo = new THREE.PlaneGeometry(width * 0.99, wallH);
          const leftWallMesh = new THREE.Mesh(leftWallGeo, wallMat);
          leftWallMesh.rotation.y = Math.PI / 2;
          leftWallMesh.position.set(-halfW, wallH / 2, 0);
          leftWallMesh.name = 'wall_left';
          leftWallMesh.castShadow = true;
          leftWallMesh.receiveShadow = true;
          group.add(leftWallMesh);

          // If half wall, add support rail bar
          if (isHalf) {
            const barGeo = new THREE.CylinderGeometry(0.015, 0.015, width * 0.99, 16);
            const barMat = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              metalness: 0.9,
              roughness: 0.2,
            });
            const barMesh = new THREE.Mesh(barGeo, barMat);
            barMesh.rotation.x = Math.PI / 2;
            barMesh.position.set(-halfW, wallH, 0);
            group.add(barMesh);
          }
        }

        // 3. Right Wall
        if (wallsConfig.rightWall !== 'none') {
          const isHalf = wallsConfig.rightWall === 'half';
          const wallH = isHalf ? yRim * 0.45 : yRim;
          const rightWallGeo = new THREE.PlaneGeometry(width * 0.99, wallH);
          const rightWallMesh = new THREE.Mesh(rightWallGeo, wallMat);
          rightWallMesh.rotation.y = -Math.PI / 2;
          rightWallMesh.position.set(halfW, wallH / 2, 0);
          rightWallMesh.name = 'wall_right';
          rightWallMesh.castShadow = true;
          rightWallMesh.receiveShadow = true;
          group.add(rightWallMesh);

          if (isHalf) {
            const barGeo = new THREE.CylinderGeometry(0.015, 0.015, width * 0.99, 16);
            const barMat = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
              metalness: 0.9,
              roughness: 0.2,
            });
            const barMesh = new THREE.Mesh(barGeo, barMat);
            barMesh.rotation.x = Math.PI / 2;
            barMesh.position.set(halfW, wallH, 0);
            group.add(barMesh);
          }
        }
      },
      []
    );

    /**
     * Load the GLTF 3D model according to selected size
     */
    const loadModel = useCallback(
      (modelPath: string) => {
        if (!sceneRef.current) return;
        setIsLoadingModel(true);

        const loader = new GLTFLoader();
        loader.load(
          modelPath,
          (gltf) => {
            if (!sceneRef.current) return;

            // Remove existing model if any
            if (currentModelGroup.current) {
              sceneRef.current.remove(currentModelGroup.current);
              currentModelGroup.current.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const m = child as THREE.Mesh;
                  m.geometry?.dispose();
                  if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
                  else m.material?.dispose();
                }
              });
            }

            const model = gltf.scene;
            currentModelGroup.current = model;
            metalMaterialsRef.current = [];

            // Traverse and process meshes
            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // Handle multi-materials or single material
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

                materials.forEach((mat) => {
                  const stdMat = mat as THREE.MeshStandardMaterial;

                  // Fabric Canopy Material
                  if (
                    stdMat.name.toLowerCase().includes('fabric_mat') ||
                    mesh.name.toLowerCase().includes('fabric')
                  ) {
                    fabricMeshRef.current = mesh;
                    remapFabricUVs(mesh.geometry);

                    // Apply master canvas texture
                    stdMat.map = textureCompositor.masterTexture;
                    stdMat.roughness = 0.85;
                    stdMat.metalness = 0.05;
                    stdMat.needsUpdate = true;
                  }
                  // Metal Frame Material
                  else if (
                    stdMat.name.toLowerCase().includes('metal') ||
                    mesh.name.toLowerCase().includes('leg') ||
                    mesh.name.toLowerCase().includes('mechanism')
                  ) {
                    metalMaterialsRef.current.push(stdMat);
                  }
                  // Inner Fabric
                  else if (stdMat.name.toLowerCase().includes('inner')) {
                    stdMat.color = new THREE.Color(0xf1f5f9);
                    stdMat.roughness = 0.9;
                  }
                });
              }
            });

            // Update frame finish
            const frameConfig = FRAME_TYPES.find((f) => f.id === state.frameType);
            if (frameConfig) {
              metalMaterialsRef.current.forEach((m) => {
                m.color = new THREE.Color(frameConfig.metalColor);
                m.roughness = frameConfig.roughness;
                m.metalness = frameConfig.metalness;
                m.needsUpdate = true;
              });
            }

            // Center model and adjust position
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y -= box.min.y; // Sit on ground plane

            sceneRef.current.add(model);

            // Update procedural walls
            updateWalls(state.walls, state.canopyColor);

            // Update master texture with initial state
            textureCompositor.updateMasterTexture(state);

            setIsLoadingModel(false);
          },
          undefined,
          (error) => {
            console.error('Error loading GLTF model:', error);
            setIsLoadingModel(false);
          }
        );
      },
      [remapFabricUVs, state, updateWalls]
    );

    /**
     * Camera View Presets
     */
    const setCameraPreset = useCallback(
      (preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'iso') => {
        const { width, maxY } = tentBounds.current;
        const dist = width * 1.8;
        const midY = maxY * 0.55;

        targetLookAt.current = new THREE.Vector3(0, midY, 0);

        switch (preset) {
          case 'front':
            targetCamPos.current = new THREE.Vector3(0, midY + 0.1, dist);
            break;
          case 'back':
            targetCamPos.current = new THREE.Vector3(0, midY + 0.1, -dist);
            break;
          case 'left':
            targetCamPos.current = new THREE.Vector3(-dist, midY + 0.1, 0);
            break;
          case 'right':
            targetCamPos.current = new THREE.Vector3(dist, midY + 0.1, 0);
            break;
          case 'top':
            targetCamPos.current = new THREE.Vector3(0, maxY * 2.2, 0.05);
            break;
          case 'iso':
          default:
            targetCamPos.current = new THREE.Vector3(dist * 0.75, maxY * 1.0, dist * 0.75);
            break;
        }
      },
      []
    );

    const resetCamera = useCallback(() => {
      setCameraPreset('iso');
    }, [setCameraPreset]);

    /**
     * Snapshot Capture for PDF generation and Cart proof
     */
    const exportSnapshot = useCallback((): string => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        return '';
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      return rendererRef.current.domElement.toDataURL('image/png');
    }, []);

    useImperativeHandle(ref, () => ({
      exportSnapshot,
      resetCamera,
      setPreset: setCameraPreset,
    }));

    // Initialize Three.js Scene
    useEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a); // Slate-900 background
      sceneRef.current = scene;

      // Wall meshes container
      const wallGroup = new THREE.Group();
      scene.add(wallGroup);
      wallMeshesGroup.current = wallGroup;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(2.8, 2.2, 3.2);
      cameraRef.current = camera;

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      rendererRef.current = renderer;

      // 4. OrbitControls
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.0;
      controls.maxDistance = 10.0;
      controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath ground
      controls.target.set(0, 1.1, 0);
      controlsRef.current = controls;

      // 5. Lighting
      // Soft ambient fill
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.85);
      scene.add(hemiLight);

      // Key light with soft shadow
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(4, 7, 5);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.bias = -0.0001;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 20;
      dirLight.shadow.camera.left = -3;
      dirLight.shadow.camera.right = 3;
      dirLight.shadow.camera.top = 3;
      dirLight.shadow.camera.bottom = -3;
      scene.add(dirLight);

      // Fill / Rim lights
      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
      rimLight.position.set(-5, 4, -4);
      scene.add(rimLight);

      const frontFill = new THREE.DirectionalLight(0xffffff, 0.5);
      frontFill.position.set(0, 2, 6);
      scene.add(frontFill);

      // 6. Ground Shadow Plane & Studio Grid
      const groundGeo = new THREE.PlaneGeometry(16, 16);
      const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      scene.add(ground);

      // Subtle circular grid
      const grid = new THREE.GridHelper(10, 20, 0x0284c7, 0x1e293b);
      grid.position.y = 0.001;
      scene.add(grid);

      // 7. Load Initial Tent Model
      const sizeConfig = TENT_SIZES.find((s) => s.id === state.size) || TENT_SIZES[1];
      loadModel(sizeConfig.modelPath);

      // 8. Render Loop
      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        // Smooth camera tweening when preset is selected
        if (targetCamPos.current && targetLookAt.current) {
          camera.position.lerp(targetCamPos.current, 0.08);
          controls.target.lerp(targetLookAt.current, 0.08);

          if (camera.position.distanceTo(targetCamPos.current) < 0.01) {
            targetCamPos.current = null;
            targetLookAt.current = null;
          }
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // 9. Resize Observer
      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const newW = containerRef.current.clientWidth;
        const newH = containerRef.current.clientHeight;
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        controls.dispose();
        renderer.dispose();
        scene.clear();
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // React to Model Size changes
    const previousSize = useRef(state.size);
    useEffect(() => {
      if (previousSize.current !== state.size) {
        previousSize.current = state.size;
        const sizeConfig = TENT_SIZES.find((s) => s.id === state.size);
        if (sizeConfig) {
          loadModel(sizeConfig.modelPath);
        }
      }
    }, [state.size, loadModel]);

    // React to Frame Type changes
    useEffect(() => {
      const frameConfig = FRAME_TYPES.find((f) => f.id === state.frameType);
      if (frameConfig && metalMaterialsRef.current.length > 0) {
        metalMaterialsRef.current.forEach((m) => {
          m.color = new THREE.Color(frameConfig.metalColor);
          m.roughness = frameConfig.roughness;
          m.metalness = frameConfig.metalness;
          m.needsUpdate = true;
        });
      }
    }, [state.frameType]);

    // React to Wall Configuration changes
    useEffect(() => {
      updateWalls(state.walls, state.canopyColor);
    }, [state.walls, state.canopyColor, updateWalls]);

    // React to Canopy / Section / Graphics updates
    useEffect(() => {
      textureCompositor.updateMasterTexture(state);
    }, [state.canopyColor, state.sections]);

    // React to Controls options (autoRotate, wireframe)
    useEffect(() => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = state.autoRotate;
        controlsRef.current.autoRotateSpeed = 2.0;
      }
    }, [state.autoRotate]);

    useEffect(() => {
      if (fabricMeshRef.current) {
        const mat = fabricMeshRef.current.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.wireframe = state.showWireframe;
          mat.needsUpdate = true;
        }
      }
    }, [state.showWireframe]);

    // React to Camera Preset triggers
    const previousPreset = useRef(state.cameraPreset);
    useEffect(() => {
      if (previousPreset.current !== state.cameraPreset) {
        previousPreset.current = state.cameraPreset;
        setCameraPreset(state.cameraPreset);
      }
    }, [state.cameraPreset, setCameraPreset]);

    /**
     * Raycasting: click on 3D tent faces to select section
     */
    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

        const targets: THREE.Object3D[] = [];
        if (fabricMeshRef.current) targets.push(fabricMeshRef.current);
        if (wallMeshesGroup.current) targets.push(...wallMeshesGroup.current.children);

        const intersects = raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
          const hit = intersects[0];
          const hitObj = hit.object;

          // Check if wall was clicked
          if (hitObj.name && hitObj.name.startsWith('wall_')) {
            onSelectSection(hitObj.name as SectionId);
            return;
          }

          // Fabric mesh clicked - determine peak or valance by hit point
          const localPoint = hit.point.clone();
          if (hitObj.parent) {
            hitObj.parent.worldToLocal(localPoint);
          }

          const { yRim } = tentBounds.current;
          const isValance = localPoint.y < yRim;
          const absX = Math.abs(localPoint.x);
          const absZ = Math.abs(localPoint.z);

          let face: 'front' | 'back' | 'right' | 'left' = 'front';
          if (absZ >= absX) {
            face = localPoint.z > 0 ? 'front' : 'back';
          } else {
            face = localPoint.x > 0 ? 'right' : 'left';
          }

          const detectedSectionId: SectionId = `${isValance ? 'valance' : 'peak'}_${face}` as SectionId;
          onSelectSection(detectedSectionId);
        }
      },
      [onSelectSection]
    );

    /**
     * Pointer Move Raycasting for cursor & hover detection
     */
    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !cameraRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

        const targets: THREE.Object3D[] = [];
        if (fabricMeshRef.current) targets.push(fabricMeshRef.current);
        if (wallMeshesGroup.current) targets.push(...wallMeshesGroup.current.children);

        const intersects = raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
          canvasRef.current.style.cursor = 'pointer';
          const hit = intersects[0];
          const localPoint = hit.point.clone();
          if (hit.object.parent) hit.object.parent.worldToLocal(localPoint);

          const { yRim } = tentBounds.current;
          const isValance = localPoint.y < yRim;
          const absX = Math.abs(localPoint.x);
          const absZ = Math.abs(localPoint.z);

          let face = 'front';
          if (absZ >= absX) face = localPoint.z > 0 ? 'front' : 'back';
          else face = localPoint.x > 0 ? 'right' : 'left';

          setHoveredSection(`${isValance ? 'valance' : 'peak'}_${face}` as SectionId);
        } else {
          canvasRef.current.style.cursor = 'grab';
          setHoveredSection(null);
        }
      },
      []
    );

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full bg-slate-950 flex flex-col overflow-hidden select-none ${
          isFullscreen ? 'fixed inset-0 z-50' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full outline-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        />

        {/* Loading Spinner Overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold tracking-wide text-sky-400 animate-pulse">
              Loading 3D Tent Geometry...
            </p>
          </div>
        )}

        {/* Hovered Section HUD Banner */}
        {hoveredSection && !isLoadingModel && (
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-sky-500/40 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg text-slate-200">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>
              Click to customize:{' '}
              <strong className="text-sky-300 capitalize">
                {hoveredSection.replace('_', ' ')}
              </strong>
            </span>
          </div>
        )}

        {/* Viewport Floating Controls */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-xl shadow-xl">
          <button
            onClick={() => setCameraPreset('front')}
            title="Front View"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-sky-600 transition text-slate-200 hover:text-white"
          >
            Front
          </button>
          <button
            onClick={() => setCameraPreset('back')}
            title="Back View"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-sky-600 transition text-slate-200 hover:text-white"
          >
            Back
          </button>
          <button
            onClick={() => setCameraPreset('left')}
            title="Left View"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-sky-600 transition text-slate-200 hover:text-white"
          >
            Left
          </button>
          <button
            onClick={() => setCameraPreset('right')}
            title="Right View"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-sky-600 transition text-slate-200 hover:text-white"
          >
            Right
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            title="Top View"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-sky-600 transition text-slate-200 hover:text-white"
          >
            Top
          </button>
          <button
            onClick={() => setCameraPreset('iso')}
            title="3D Isometric"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600/30 text-sky-300 border border-sky-500/30 hover:bg-sky-600 hover:text-white transition"
          >
            <Compass className="w-3.5 h-3.5 inline mr-1" />
            3D Iso
          </button>
        </div>

        {/* Viewport Top-Right Actions */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-xl shadow-xl">
          <button
            onClick={onToggleAutoRotate}
            title={state.autoRotate ? 'Stop Rotation' : 'Auto-Rotate 360°'}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              state.autoRotate
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleWireframe}
            title={state.showWireframe ? 'Solid View' : 'Wireframe Mode'}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              state.showWireframe
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            title="Reset Camera Angle"
            className="p-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            className="p-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* 3D Instructions helper chip */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur text-[11px] text-slate-400 px-3 py-1.5 rounded-lg border border-slate-800">
          <Camera className="w-3.5 h-3.5 text-slate-400" />
          <span>Drag to orbit • Scroll to zoom • Click face to customize</span>
        </div>
      </div>
    );
  }
);

ThreeViewport.displayName = 'ThreeViewport';
