function initSlider() {
	if ($("#slider").length > 0) {
		$("#slider").noUiSlider({ 
			start: [ 2000, 9000 ],
			connect: true,
			range: {
				'min': 0,
				'max': 13524
			}
		});
		$("#slider").Link('lower').to('-inline-<div class="filter-tooltip"></div>', null, wNumb({ decimals: 0,thousand: ','}), function ( value ) {

			// The tooltip HTML is 'this', so additional
			// markup can be inserted here.
			$(this).html(
				'<span>' + value + '</span>'
			);
		})

		$("#slider").Link('upper').to('-inline-<div class="filter-tooltip"></div>', null, wNumb({ decimals: 0, thousand: ','}), function ( value ) {

			// The tooltip HTML is 'this', so additional
			// markup can be inserted here.
			$(this).html(
				'<span>' + value + '</span>'
			);
		});
	} else {
		setTimeout(initSlider, 1);
	}
}

initSlider();



