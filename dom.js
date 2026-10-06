export function updateLiveWords(words){
	const container = document.getElementById('live-words');
	container.innerHTML = '';
	
	words.forEach(word => {
		const span = document.createElement('span');
		span.textContent = word;
		container.appendChild(span);
	});
}