title: Nuemral Systems
 desc: newton
 date: 2023-03-31

{% style %}
.hieroglyphic {
	padding: 0 2px;
}
{% endstyle %}

<div>
  <input id="input" type="number" value="24">
  <p>
    <h3>Roman Numerals</h3>
	<span id="n1"></span>
    <h3>Egyptian Hieroglyphics</h3>
	<span id="n2"></span>
  </p>
</div>


{% script %}

function digits(n) {
	let ns = [];
	while(n > 0) {
		ns.push(n%10);
		n = Math.trunc(n/10);
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
	};

	if(n >= 4000) {
		return 'N/A';
	}

	const ns = digits(n);

	let s = '';
	if(ns[3] != undefined) {
		s += thousands[ns[3]];
	} if(ns[2] != undefined) {
		s += hundreds[ns[2]];
	} if(ns[1] != undefined) {
		s += tens[ns[1]];
	} if(ns[0] != undefined) {
		s += units[ns[0]];
	}

	return s;
}

function toEgyptianNumerals(n) {
	if(n >= 10_000_000) {
		return 'N/A';
	}

	const numerals = [
		'<img class="hieroglyphic" alt="z1" src="/media/hieroglyphics-z1.png">',
		'<img class="hieroglyphic" alt="v20" src="/media/hieroglyphics-v20.png">',
		'<img class="hieroglyphic" alt="v1" src="/media/hieroglyphics-v1.png">',
		'<img class="hieroglyphic" alt="m12" src="/media/hieroglyphics-m12.png">',
		'<img class="hieroglyphic" alt="d50" src="/media/hieroglyphics-d50.png">',
		'<img class="hieroglyphic" alt="i8" src="/media/hieroglyphics-i8.png">',
		'<img class="hieroglyphic" alt="c11" src="/media/hieroglyphics-c11.png">',
	];

	const ns = digits(n);

	let s = '';
	if(ns[6] != undefined) {
		s += numerals[6].repeat(ns[6]);
	} if(ns[5] != undefined) {
		s += numerals[5].repeat(ns[5]);
	} if(ns[4] != undefined) {
		s += numerals[4].repeat(ns[4]);
	} if(ns[3] != undefined) {
		s += numerals[3].repeat(ns[3]);
	} if(ns[2] != undefined) {
		s += numerals[2].repeat(ns[2]);
	} if(ns[1] != undefined) {
		s += numerals[1].repeat(ns[1]);
	} if(ns[0] != undefined) {
		s += numerals[0].repeat(ns[0]);
	}

	return s;
}

function render(n) {
	document.querySelector('#n1').innerHTML = toRomanNumerals(n);
	document.querySelector('#n2').innerHTML = toEgyptianNumerals(n);
}

window.addEventListener('load', () => {
	render(input.value);
    document.querySelector('#input').addEventListener('input', e => {
		render(e.target.value);
	});
});

{% endscript %}
