export function loadNotes(){
	const stored = localStorage.getItem('compass_notes');
	return stored ? JSON.parse(stored) : [];
}

export let notes = loadNotes();

export function downloadNoteAsFile(note){
	const filename = `note-${note.timestamp.replace(/[:.]/g, '-')}.txt`
	const blob = new Blob([note.text], { type: 'text/plain' });
	const url  = URL.createObjectURL(blob);
	
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	
	URL.revokeObjectURL(url);
}

export function saveNote(text){
	const note = {
		text: text,
		timestamp: new Date().toISOString(),
	};
	
	notes.push(note);
	localStorage.setItem('compass_notes', JSON.stringify(notes));
	console.log("saved. total notes: ", notes.length);
	
	downloadNoteAsFile(note);
}