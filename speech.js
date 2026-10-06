import { saveNote } from './storage.js';
import { updateLiveWords} from './dom.js';

//mode -> conversation vs. listening

let mode = 'idle';
const wakeWord = "hey compass"; //TODO: name it

let isNoteMode = false;
let noteBuffer = '';
let closingNoteMode = false;
let noteFallbackTimer = null;

let committedWords = [];

function finishNote() {
	closingNoteMode = false;
	isNoteMode = false;
	if (noteFallbackTimer) clearTimeout(noteFallbackTimer);
	if (noteBuffer.trim()) {
		saveNote(noteBuffer.trim());
	}
}

export function setupSpeechRecognition(){
	const recognition = new webkitSpeechRecognition();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.lang = 'en-US';
	
	
	recognition.onresult = (e)=>{
		const lastResult = e.results[e.results.length - 1];
		const rawTranscript = lastResult[0].transcript.trim().toLowerCase();
		const currentSegmentWords = rawTranscript.split(/\s+/).filter(Boolean);
		
		const displayWords = [...committedWords, ...currentSegmentWords].slice(-3);
		updateLiveWords(displayWords);
		
		if(!lastResult.isFinal) return;
		
		committedWords = [...committedWords, ...currentSegmentWords].slice(-3);
		const transcript = rawTranscript.toLowerCase();
		
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

}