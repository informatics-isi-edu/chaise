//'use strict';

/* Model Module */

var facetsModel = angular.module('facetsModel', []);

//angular.module('ermrestApp').factory('FacetsData', function() {
facetsModel.factory('FacetsData', function() {
	return {
		'box': {},
		'bookmark': '#',
		'bookmarkPage': null,
		'chooseColumns': {},
		'collectionsPredicate': '',
		'colsDefs': [],
		'colsDescr': {},
		'colsGroup': {},
		'datasetFiles': {},
		'denormalizedView': {},
		'detailColumns': [],
		'detailRows': [],
		'details': false,
		'enabledFilters': {},
		'enableAll': false,
		'entryRow': [],
		'entityPredicates': [],
		'entry3Dview': '',
		'entrySubtitle': '',
		'entryTitle': '',
		'ermrestData': [],
		'error': false,
		'exportOptions': {
			format: {},
			formatOptions:{},
			defaultFormat: {name:"CSV", type:"DIRECT", template:null},
			defaultFormats:[
				{name:"CSV", type:"DIRECT", template:null},
				{name:"JSON", type:"DIRECT", template:null}
			],
			supportedFormats:[],
			exportPredicate:'',
			exportUrl:''
		},
		'externalReferenceRows': [],
		'facetClass': {},
		'facetPreviousValues': {},
		'facets': [],
		'facetSelection': false,
		'files': [],
		'filter': null,
		'filterAllText': '',
		'filterOptions': {
			filterText: "",
			useExternalFilter: true
		},
		'filterSearchAllTimeout': null,
		'filterSliderTimeout': null,
		'filterTextTimeout': null,
		'level': 0,
		'linearizeView': {},
		'isDetail': false,
		'maxPages': 0,
		'metadata': {},
		'moreFlag': false,
		'narrow': {},
		'narrowFilter': '',
		'pageMap': {},
		'pageNavigation': false,
		'pagingOptions': {
			pageSizes: [25, 50, 100],
			pageSize: 25,
			currentPage: 1
		},
		'pageRange': [],
		'plotOptions': {
			keys:[],
			keyLabels:[],
			data:[],
			dataUrl:'',
			format: defaultPlotFormats[0],
			supportedFormats: defaultPlotFormats,
			coordinates: {
				x:{ column:null, display:null },
				y:{ column:null, display:null },
				z:{ column:null, display:null }
			}
		},
		'progress': false,
		'ready': false,
		'score': [],
		'searchFilter': '',
		'searchFilterTimeout': null,
		'searchFilterValue': {},
		'selectedEntity': null,
		'sessionFilters': {},
		'sortColumns': [''],
		'sortDirection': 'asc',
		'sortDirectionOptions': ['asc', 'desc'],
		'sortFacet': '',
		'sortInfo': {'fields': [], 'directions': []},
		'sortOrder': null,
		'table': '',
		'tables': [],
		'tablesStack': [],
		'tag': null,
		'tagPages': 5,
		'textEntryRow': [],
		'thumbnails': {},
		'tiles': [],
		'totalServerItems': 0,
		'tree': [],
		'view': null,
		'viewer3dFile': []
	};
});

var defaultPlotFormats =
[
	{
		name:"Histogram",
		type:"histogram",
		marker: {
			color: 'rgba(50,250,50,0.7)'
		},
		coordinates:['x'],
		layout:{
			hovermode: 'closest',
			margin: { t: 0, l: 30, r: 0, b: 30 },
			bargap: 0.05,
			bargroupgap: 0.2,
			barmode: "overlay",
			showlegend: false,
			autosize: true
		}
	},
	{
		name:"Histogram 2D",
		type:"histogram2dcontour",
		marker: {
			color: 'red'
		},
		coordinates:['x','y'],
		layout:{
			hovermode: 'closest',
			margin: { t: 0, l: 30, r: 0, b: 30 },
			showlegend: false,
			autosize: true
		}
	},
	{
		name:"Scatter",
		type:"scatter",
		mode:"markers",
		marker: {
			color: 'rgba(1,1,255,0.7)',
			outliercolor: 'red'
		},
		coordinates:['x', 'y'],
		layout:{
			hovermode: 'closest',
			margin: { t: 0, l: 30, r: 0, b: 30 },
			showlegend: false,
			autosize: true
		}
	},
	{
		name:"Bar",
		type:"bar",
		mode:"markers",
		marker: {
			color: 'rgba(1,1,255,0.4)'
		},
		coordinates:['x','y'],
		layout:{
			hovermode: 'closest',
			margin: { t: 0, l: 30, r: 0, b: 30 },
			bargap: 0.1,
			bargroupgap: 0.5,
			barmode: "overlay",
			showlegend: false,
			autosize: true
		}
	}
];
