title: Newton
 desc: newton
 date: 2023-03-31

{% style %}
#polynomial input {
	/*display: inline;
	width: 1em;
	border: none;*/
	border: none;
	font-family: "Inconsolata", monospace !important;
}
{% endstyle %}

<div id="polynomial">
	<!--input id="x2" value="1">x<sup><input id="x2" value="1"></sup>+<input id="x1" value="1">x+<input id="x0" value="1"-->
	<p id="root"></p>
</div>

{% script %}
let polynomial = [];

function sum(x) {
	let total = 0;
	for(let i=0; i<3; ++i) {
		total += document.querySelector(`#x${i}`).value * x**i;
	}
	return total;
}

function sumdiff(x) {
	let total = 0;
	for(let i=1; i<3; ++i) {
		total += (i-1)*document.querySelector(`#x${i}`).value * x**(i-1);
	}
	return total;
}

class Term {
	constructor(coefficient, power) {
		this.width = 1;

		this.coefficient = document.createElement('input');
		this.power = document.createElement('input');
		const sup = document.createElement('sup');
		sup.append(power);

		this.coefficient.value = coefficient;
		this.coefficient.style.width = '1ch';
		this.power.value = power;
		this.power.style.width = '1ch';

		this.coefficient.addEventListener('input', e => {
			const newWidth = e.target.value.toString().length;
			if(newWidth != this.width) {
				this.width = newWidth;
				this.coefficient.style.width = `${this.width+.3}ch`;
			}
		});
		/*
		power.addEventListener('input', e => {
			polynomial[pos][1] = e.target.value;
		});
		*/

		document.querySelector('#polynomial').append(this.coefficient, 'x', sup);
	}
}

let terms = [];

function addTerm() {
	terms.push(new Term(1, 1));
	if(terms) {
		document.querySelector('#polynomial').append('+');
	}
/*
	const coefficient = document.createElement('input');
	const power = document.createElement('input');
	const sup = document.createElement('sup');
	sup.append(power);

	coefficient.value = 1;
	coefficient.style.width = '1ch';
	power.value = 1;
	power.style.width = '1ch';

	const pos = polynomial.length;
	coefficient.addEventListener('input', e => {
		polynomial[pos][0] = e.target.value;
		if(e.target.value != )
	});
	power.addEventListener('input', e => {
		polynomial[pos][1] = e.target.value;
	});

	polynomial.append([1,1])

	document.querySelector('#polynomial').append(coefficient, 'x', sup, polynomial ? ' + ' : '');
	*/
}

window.addEventListener('load', () => {
	addTerm();
	addTerm();
});

/*
let guess = 0;
for(let i=0; i<20; ++i) {
	guess = guess - sum(guess)/sumdiff(guess);
}
*/
{% endscript %}
