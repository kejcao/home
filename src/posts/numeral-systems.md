title: Nuemral Systems
 desc: newton
 date: 2023-03-31

<div>
  <input id="input" type="number" value="24">
  <p>
	  <span id="n1">XXIV</span>
	  <span id="n2">2.4e1</span>
  </p>
</div>


{% script %}

function digits(n) {
	let ns = []
	while(n > 0) {
		ns.push(n%10);
		n /= 10;
	}
	return ns;
}

function toRomanNumerals(n) {
	const units = {
		1: 'I', 2: 'II',
		3: 'III', 4: 'IV',
		5: 'V', 6: 'VI',
		7: 'VII', 8: 'VIII',
		9: 'IX', 0: '',
	};

	const tens = {
		1: 'X', 2: 'XX',
		3: 'XXX', 4: 'XL',
		5: 'L', 6: 'LX',
		7: 'LXX', 8: 'LXXX',
		9: 'XC', 0: '',
	};

	const hundreds = {
		1: 'C', 2: 'CC',
		3: 'CCC', 4: 'CD',
		5: 'D', 6: 'DC',
		7: 'DCC', 8: 'DCCC',
		9: 'CM', 0: '',
	};

	const thousands = {
		1: 'M', 2: 'MM',
		3: 'MMM',
		0: '',
	};

	if(n > 3000) {
		return 'N/A';
	}

	const ns = digits(n);

	return (
		thousands[ns[3]] +
		hundreds[ns[2]] +
		tens[ns[1]] +
		units[ns[0]]
	);
}

//function toScientificTheory(n) {

function toEgyptianNumerals(n) {
	const numerals = {
		1: '/media/hieroglyphic-z1.png',
	};
	return (
		`<img src="${(Math.trunc(n/1) % 10) * numerals[1]}">`
	);
}

window.addEventListener('load', () => {
    document.querySelector('#input').addEventListener('input', e => {
		document.querySelector('#n1').innerHTML = toRomanNumerals(e.target.value);
		document.querySelector('#n2').innerHTML = toEgyptianNumerals(e.target.value);
	});
});

{% endscript %}
