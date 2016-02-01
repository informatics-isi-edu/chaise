
var tourTemplate = '<div class="popover" role="tooltip"> \
<div class="arrow"></div> \
<h3 class="popover-title"></h3> \
<div class="popover-content"></div> \
<div class="popover-navigation"> \
<div class="btn-group"> \
<button class="btn btn-sm btn-primary" data-role="prev"> \
&laquo; Prev \
</button> \
<button class="btn btn-sm btn-primary" data-role="next"> \
Next &raquo; \
</button> \
<button class="btn btn-sm btn-successs" data-role="pause-resume" data-pause-text="Pause" data-resume-text="Resume"> \
Pause \
</button> \
</div> \
<button class="btn btn-sm btn-danger" data-role="end"> \
End tour \
</button> \
</div> \
</div>';


var tour; // Tour Object

/**
* @desc creates the tour oject if it's undefined.
*/
function createTourObject(){
  if(!tour){
    tour = new Tour({ //creating the tour
      name: "DataBrowserTour",
      template: tourTemplate,
      orphan: true, //not sure
      backdrop: true,
      backdropPadding: 1
    });
  }
}

/**
* @desc adds steps and intiializes the tour.
*/
function initTour(){

  createTourObject();

  addSteps();
  tour.init();
}

/**
* @desc restarts the tour (add step and restart)
*/
function restartTour(){
  createTourObject();

  addSteps();

  tour.setCurrentStep(0);
  tour.init();
  tour.restart();
}

/**
* @desc creates the steps and adds them to tour.
*/
function addSteps(){
  var extraAttr = getExtraAttribute(); // for adding an attribute step.
  var chosenAttr = getChosenAttribute(); // for choosing an attribute step.
  var chosenValue = false; // for choosing value step.
  var searchChosenAttr = false; // for searching attribute step.
  var searchInputAttr = false; // for searching attribute step.
  var searchInputValue = false; // for searching value step.

  extraAttr.siblings("div").find('input:checked').click(); // removes extra attr from list of attrs

  var tourSteps = [{
    element: "#navcontainer .sidebar-nav",
    title: "Choose Attriutes",
    content: "Using this list you can select attributes to filter the results.",
    placement: "left",
  }, {
    element: "a.view-attr",
    title: "View All Attributes",
    content: "There are many more available attributes to refine your search - \
  You can click here to see the list of all available attributes.",
    placement: "left",
    onNext: function(tour) {
      $("a.view-attr").click();

    }
  }, {
    element: ".editvalue-container:eq(0)",
    title: "Add New Attribute",
    content: "As we clicked on 'View all attributes' this list came up. \
  Here you can see list of all attributes. We'll choose to add  \
  " + createLabel(extraAttr.text().trim()) + "as an attribute and get back to list of \
  attributes using the 'All Attributes' button on top.",
    placement: "left",
    onNext: function(tour) {
      extraAttr.click();
      $(".sidebar-toggle.field-enable:eq(0)").click();
    },
    onPrev: function(tour) {
      $(".sidebar-toggle.field-enable:eq(0)").click();
    }
  }, {
    element: "#navcontainer .sidebar-nav .field-toggle:contains('" + extraAttr.text().trim() + "')",
    title: "New Attribute",
    placement: "left",
    content: "As you can see, " + createLabel(extraAttr.text().trim()) +
      " is now added to list of attributes.",
    onPrev: function(tour) {
      $("a.view-attr").click();
      extraAttr.click();
    }
  }, {
    element: "#navcontainer a:visible:not(.view-attr):contains(" + chosenAttr.text().trim() + "):eq(0)",
    title: "Choose Attriutes",
    content: "Let's choose " + createLabel(chosenAttr.text().trim()) + " to see its values.",
    placement: "left",
    onNext: function(tour) {
      chosenAttr.click();
      chosenValue = chosenValue ? chosenValue : getChosenValue();
    }
  }, {
    element: ".nav.filteritems",
    title: "Choose Values",
    content: 'Now you can see all different values for \
  ' + createLabel(chosenAttr.text().trim()) + ' in the databse. \
  You can choose as many as you want. We are going to choose one of them.',
    placement: "left",
    onShow: function(tour) {},
    onPrev: function(tour) {
      $(".field-enable.sidebar-toggle:eq(1)").click();
    },
    onNext: function(tour) {
      chosenValue.click();
    }
  }, {
    element: ".field-enable.sidebar-toggle:eq(1)",
    title: "Go Back",
    content: 'To go back to the default sidebar view, you can click here.',
    placement: "left",
    onNext: function(tour) {
      $(".field-enable.sidebar-toggle:eq(1)").click();
    },
    onPrev: function(tour) {
      chosenValue.click();
    }
  }, {
    element: '#results_tally.row',
    title: "Results Tally",
    placement: "bottom",
    content: "You can see results tally. You can also switch between different types of view or change sort.",
    onPrev: function(tour) {
      chosenAttr.click();
    }
  }, {
    element: "#filter",
    title: "Filters",
    content: "In here you can see all the filters that are applied. By \
  clicking on <i class='md-cancel md-lg'></i> button you can clear the filter.",
    placement: "right",
  }, {
    element: "#filter .filter-item:visible a:not(:contains(Clear),.filter-link-cancel)",
    title: " Chosen Attributes",
    content: "To choose different values for this attribute, you can click here.",
    placement: "bottom",
    onNext: function(tour) {
      $("#filter .filter-item:visible a:not(:contains(Clear),.filter-link-cancel)").click();
    }
  }, {
    element: ".nav.filteritems",
    title: "Add Value",
    content: "As we clicked on the attribute name in filter lists, this list came up. \
  You can change your filters in here.",
    placement: "left",
    onPrev: function(tour) {
      $(".field-enable.sidebar-toggle:eq(1)").click();
    },
    onNext: function(tour) {
      $(".field-enable.sidebar-toggle:eq(1)").click();
    }
  }, {
    element: ".search-box input:eq(0)",
    title: "Search Attributes",
    content: 'You can also search within attributes using this box. \
  Just type something and list of attributes will be filtered.',
    placement: "left",
    onNext: function(tour) {
      searchInputAttr = searchInputAttr ? searchInputAttr : getSearchTerm(true, $("#navcontainer a:visible:not(.view-attr)"));
      $(".search-box input:eq(0)").val(searchInputAttr).trigger('input').keyup();
    },
    onPrev: function(tour) {
      $("#filter .filter-item:visible a:not(:contains(Clear),.filter-link-cancel)").click();
    }
  }, {
    element: "#navcontainer .sidebar-nav",
    title: "Filtered Attribute List",
    content: "As you can see after adding the term, this list is filtered.",
    placement: "left",
    onNext: function(tour) {
      searchChosenAttr = searchChosenAttr ? searchChosenAttr : getSearchChosenAttribute();
      searchChosenAttr.click();
      $(".search-box input:eq(0)").val("").trigger('input').keyup();
    },
    onPrev: function(tour) {
      $(".search-box input:eq(0)").val("").trigger('input').keyup();
    }
  }, {
    element: ".search-box input:eq(2)",
    title: "Search Values",
    content: "You can also search in values of attributes.",
    placement: "left",
    onPrev: function(tour) {
      $(".field-enable.sidebar-toggle:eq(1)").click();
      $(".search-box input:eq(0)").val(searchInputAttr).trigger('input').keyup();
    },
    onNext: function(tour) {
      searchInputValue = searchInputValue ? searchInputValue : getSearchTerm(false, $('.filteritems .field-enable:visible label'));
      $(".search-box input:eq(2)").val(searchInputValue).trigger('input').keyup();
    }
  }, {
    element: ".nav.filteritems",
    title: "Filtered Values",
    content: "As you can see the values are filtered based on search box.",
    placement: "left",
    onPrev: function(tour) {
      $(".search-box input:eq(2)").val("").trigger('input').keyup();
    },
    onNext: function(tour) {
      $(".search-box input:eq(2)").val("").trigger('input').keyup();
      $(".field-enable.sidebar-toggle:eq(1)").click();
    }
  }, {
    element: '#resultstable .panel:eq(0)',
    title: "Dataset Details",
    content: "By clicking on title of each dataset, you can see its details.",
    placement: "right",
    onPrev: function(tour) {
      searchChosenAttr.click();
      $(".search-box input:eq(2)").val(searchInputValue).trigger('input').keyup();
    }
  }, {
    title: "Find out more",
    content: "You can find more tutorial in <a target='_blank' href='" + chaiseConfig.helpURL + "'>here</a>.",
    placement: "bottom",
  }];


  $.each(tourSteps, function(i, step) { // adding the step indicator
    step['title'] += '<span class="pull-right">' + (i + 1) + '/' + tourSteps.length + '</span>';
    var percent = parseInt(((i + 1) / tourSteps.length) * 100);
    step['content'] = '<div class="pbar_wrapper"><hr class="pbar" style="width:' + percent + '%;"></div>' + step['content'];
  });

  tour._options.steps = [];
  tour.addSteps(tourSteps);

}

/**
 * @desc Get the element that represents the chosen extra attribute in tour.
 */
function getExtraAttribute() {
  return getTourElement("extraAttribute", $("#morefilters .editvalue-container .field-enable label").not(":contains(image)"));
}

/**
 * @desc Get the element that represents the chosen attribute in tour.
 */
function getChosenAttribute() {
  return getTourElement("chosenAttribute", $("#navcontainer a:visible:not(.view-attr)"));
}

/**
 * @desc Get the element that is being used to demonestarte search value feature.
 */
function getSearchChosenAttribute() {
  return getTourElement("searchChosenAttribute", $("#navcontainer a:visible:not(.view-attr)"));
}

/**
 * @desc Get the element that represents the chosen value in tour.
 */
function getChosenValue() {
  return getTourElement("chosenValue", $('.filteritems .field-enable:visible label'));
}

/**
 * @desc Get the search value used for tour.
 * @param isAttr {boolean} true: search value for choosing attribute, false: for choosing value.
 * @param elements {Array} if search term was not defined, get one of these for random.
 */
function getSearchTerm(isAttr, elements) {
  var result = "";
  try {
    result = isAttr ? chaiseConfig.tour.searchInputAttribute : chaiseConfig.tour.searchInputValue;
  } catch (e) {}
  return result ? result : getRandom(elements).text().trim();
}

/**
 * @desc Used for getting tour elements from config file or randomly selecting them.
 * @param elName {string} Name of the element. (it should be defined in config file.)
 * @param elements {Array} List of elements to choose from.
 */
function getTourElement(elName, elements) {
  var result = false;
  try {
    if (!chaiseConfig.tour.pickRandom) {
      result = elements.filter(":contains(" + chaiseConfig.tour[elName] + ")");
    }
  } catch (e) {}
  return (result && result.length) ? result : getRandom(elements);
}

/**
 * @desc Returns a random item from a list of items.
 */
function getRandom(items) {
  return $(items[Math.floor(Math.random() * items.length)]);
}

/**
 * @desc Create label for elements
 */
function createLabel(content) {
  return " <span class='label label-default'>" + content + "</span> ";
}
