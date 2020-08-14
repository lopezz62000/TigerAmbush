// list of texts
const texts = [
	'Welcome to Tiger Ambush!',
	'Chat with Fellow Tigers.',
	'Make New Friends.',
	'Meeting up virtually since 2020.',
	"Here's an example of a chat:",
	'Loading...',
	'John: Hi my name is John!',
	"Ruby: Hi I'm Ruby.",
	'John: What class are you?',
	'Ruby: Class of 2022. wbu?',
	'John: 2023 lol.',
	'TigerAmbush - An App Built For You.'
];
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
