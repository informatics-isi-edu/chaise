function loadApplicationHeaderAndFooter() {
}

function initApplicationHeader(tables) {
	$('#headerSearch').keyup(function(event) {$('#dataSearch').val($('#headerSearch').val());$('#dataSearch').change();});
}

