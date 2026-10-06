//smooth simplex sound, not random noise
export const simplex = new SimplexNoise();

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

export const geometry = new THREE.IcosahedronGeometry(1.6, 4);
const material = new THREE.MeshStandardMaterial({
	color: 0x000000,
	emissive: 0x330000,
	roughness: 0.3,
	metalness: 0.1,
});

const blob = new THREE.Mesh(geometry, material);
//scene.add(blob);

const edgeMaterial = new THREE.MeshBasicMaterial({
	color: 0xff0000,
	wireframe: true,
	transparent: true,
	opacity: 0.2,
	depthTest: false,
});

export const edges = new THREE.Mesh(geometry, edgeMaterial);
edges.scale.setScalar(1.001);

export const blobGroup = new THREE.Group();
blobGroup.add(blob);
blobGroup.add(edges);


edges.renderOrder = 1;
edges.visible = true;

scene.add(blobGroup);

//save the original position, otherwise it explodes
export const positionAttribute = geometry.attributes.position;
export const originalPositions = positionAttribute.array.slice();

//light and blob stuff, if I don't use the edges
const light = new THREE.PointLight(0xff3333, 3.3, 100);
light.position.set(5, 5, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0x220000);
scene.add(ambient);

export const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

