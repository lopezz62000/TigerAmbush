// list of texts
const texts = [ 'Chat with Your Fellow Tigers.' ];
let count = 0;
let index = '';
let currentText = '';
let letter = '';
let typing = document.querySelector('.typing');

(function type() {
	// compares to count to length of array
	if (count === texts.length) {
		return;
	}
	currentText = texts[count];
	// substring -- adding one more character to value
	letter = currentText.slice(0, ++index);

	typing.textContent = letter;

	if (letter.length === currentText.length) {
		count++;
		index = 0;
	}

	setTimeout(type, 200);
})();