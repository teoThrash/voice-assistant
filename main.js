import { scene, camera, renderer, blobGroup, positionAttribute, originalPositions, simplex } from './scene.js';
import { audioData, audioAnalyser, setupAudio } from './audio.js';
import { setupSpeechRecognition } from './speech.js';
import { scene, camera, renderer, blobGroup, positionAttribute, originalPositions, simplex, geometry } from './scene.js';

setupAudio();
setupSpeechRecognition();

let smoothedAmplitude = 0;

function animate(){
	requestAnimationFrame(animate);
	
	//const rotationSpeed = 0.0002 + smoothedAmplitude * 0.0015;
	blobGroup.rotation.y += 0.001;
	blobGroup.rotation.x += 0.001;
	
	if(audioData && audioAnalyser){
		audioAnalyser.getByteFrequencyData(audioData);
		const volume = audioData.reduce( (a, b) => a+b) / audioData.length;
		
		//console.log(volume);
		
		/*const scale = 1 + (volume / 255) * 0.8;
		
		blob.scale.set(scale, scale, scale);
		*/
		
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