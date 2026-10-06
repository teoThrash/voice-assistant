
export let audioData = null;
export let audioAnalyser = null;

export async function setupAudio(){
	const stream = await navigator.mediaDevices.getUserMedia({audio: true});
	const audioContext = new AudioContext();
	const source = audioContext.createMediaStreamSource(stream);
	const analyser = audioContext.createAnalyser();
	
	analyser.fftSize = 256;
	source.connect(analyser);
	
	audioData = new Uint8Array(analyser.frequencyBinCount);
	audioAnalyser = analyser;
	
}