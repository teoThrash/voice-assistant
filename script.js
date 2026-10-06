//smooth simplex sound, not random noise
const simplex = new SimplexNoise();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

//organic blob

const geometry = new THREE.IcosahedronGeometry(1.6, 4);
const material = new THREE.MeshStandardMaterial({
	color: 0x000000,
	emissive: 0x330000,
	roughness: 0.3,
	metalness: 0.1,
});

const blob = new THREE.Mesh(geometry, material);

const edgeMaterial = new THREE.MeshBasicMaterial({
	color: 0xff0000,
	wireframe: true,
	transparent: true,
	opacity: 0.2,
	depthTest: false,
});

const edges = new THREE.Mesh(geometry, edgeMaterial);
edges.scale.setScalar(1.001);

const blobGroup = new THREE.Group();
blobGroup.add(blob);
blobGroup.add(edges);

edges.renderOrder = 1;
edges.visible = true;

scene.add(blobGroup);

//save the original position, otherwise it explodes
const positionAttribute = geometry.attributes.position;
const originalPositions = positionAttribute.array.slice();

//light and blob stuff
const light = new THREE.PointLight(0xff3333, 3.3, 100);
light.position.set(5, 5, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0x220000);
scene.add(ambient);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let audioData = null;

let smoothedAmplitude = 0;

//mode -> conversation vs. listening

let mode = 'idle';
const wakeWord = "hey compass"; //TODO: name it

let isNoteMode = false;
let noteBuffer = '';

//setting up the audio

async function setupAudio(){
	const stream = await navigator.mediaDevices.getUserMedia({audio: true});
	const audioContext = new AudioContext();
	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();

	analyser.fftSize = 256;
	source.connect(analyser);

	audioData = new Uint8Array(analyser.frequencyBinCount);
	window.audioAnalyser = analyser;
}

setupAudio();

function updateLiveWords(words){
	const container = document.getElementById('live-words');
	container.innerHTML = '';

	words.forEach(word => {
		const span = document.createElement('span');
		span.textContent = word;
		container.appendChild(span);
	});
}

//voice recognition - OPEN WITH CHROME!

const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

let committedWords = [];

recognition.onresult = (e)=>{
	const lastResult = e.results[e.results.length - 1];
	const rawTranscript = lastResult[0].transcript.trim().toLowerCase();
	const currentSegmentWords = rawTranscript.split(/\s+/).filter(Boolean);

	const displayWords = [...committedWords, ...currentSegmentWords].slice(-3);
	updateLiveWords(displayWords);

	if(!lastResult.isFinal) return;

	committedWords = [...committedWords, ...currentSegmentWords].slice(-3);
	const transcript = rawTranscript;

	if(isNoteMode){
		noteBuffer += transcript + ' ';
		console.log('...capturing: ', transcript);
		if (closingNoteMode) {
			finishNote();
		}
		return;
	}

	if(mode=='idle'){
		if(transcript.includes(wakeWord)){
			mode = 'conversation';
			console.log("into conversation mode");

			const afterWakeWord = transcript.split(wakeWord)[1]?.trim();

			if(afterWakeWord){
				console.log("one breath question ", afterWakeWord);
				mode = 'idle';
			}
		}
	}else if(mode=='conversation'){
		console.log("question ", transcript);
		mode = 'idle';
	}
};

recognition.start();

//note mode
let closingNoteMode = false;
let noteFallbackTimer = null;

function finishNote() {
	closingNoteMode = false;
	isNoteMode = false;
	if (noteFallbackTimer) clearTimeout(noteFallbackTimer);
	if (noteBuffer.trim()) {
		saveNote(noteBuffer.trim());
	}
}

window.addEventListener('keydown', (e) =>{
	if(e.key.toLowerCase()=='v' && !isNoteMode){
		closingNoteMode = false;
		if (noteFallbackTimer) clearTimeout(noteFallbackTimer);
		isNoteMode = true;
		noteBuffer = '';
		console.log("Note Mode: started");
	}
});

window.addEventListener('keyup', (e)=>{
	if(e.key.toLowerCase()=='v' && isNoteMode){
		closingNoteMode = true;
		console.log('waiting for final result before closing...');
		noteFallbackTimer = setTimeout(finishNote, 3000);
	}
});

function loadNotes(){
	const stored = localStorage.getItem('compass_notes');
	return stored ? JSON.parse(stored) : [];
}

let notes = loadNotes();

function downloadNoteAsFile(note){
	const filename = `note-${note.timestamp.replace(/[:.]/g, '-')}.txt`;
	const blob = new Blob([note.text], { type: 'text/plain' });
	const url  = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();

	URL.revokeObjectURL(url);
}

function saveNote(text){
	const note = {
		text: text,
		timestamp: new Date().toISOString(),
	};

	notes.push(note);
	localStorage.setItem('compass_notes', JSON.stringify(notes));
	console.log("saved. total notes: ", notes.length);

	downloadNoteAsFile(note);
}

function animate(){
	requestAnimationFrame(animate);

	blobGroup.rotation.y += 0.001;
	blobGroup.rotation.x += 0.001;

	if(audioData && window.audioAnalyser){
		window.audioAnalyser.getByteFrequencyData(audioData);
		const volume = audioData.reduce( (a, b) => a+b) / audioData.length;

		const time = Date.now() * 0.0003;

		const normalizedVolume = Math.pow(volume / 255, 0.6);
		const targetAmplitude = normalizedVolume * 0.95;

		const attackSpeed = 0.3;
		const releaseSpeed = 0.03;

		//lerp - linear interpolation

		if(targetAmplitude > smoothedAmplitude){
			smoothedAmplitude += (targetAmplitude - smoothedAmplitude) * attackSpeed;
		}else{
			smoothedAmplitude += (targetAmplitude - smoothedAmplitude) * releaseSpeed;
		}

		const idleBreath = 0.05 + Math.sin(time * 0.6) * 0.025;
		const amplitude = smoothedAmplitude + idleBreath;

		for(let i=0; i<positionAttribute.count; i++){
			const ix = i*3;

			const ox = originalPositions[ix];
			const oy = originalPositions[ix+1];
			const oz = originalPositions[ix+2];

			const noise = simplex.noise4D(ox * 1.1, oy * 1.1, oz * 1.1, time);
			const displacement = 1 + noise * amplitude;

			positionAttribute.array[ix] = ox * displacement;
			positionAttribute.array[ix+1] = oy * displacement;
			positionAttribute.array[ix+2] = oz * displacement;
		}

		positionAttribute.needsUpdate = true;
		geometry.computeVertexNormals();
	}

	renderer.render(scene, camera);
}

animate();