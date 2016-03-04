// Configure deployment-specific data here

var chaiseConfig = {
    authnProvider: 'goauth',
    feedbackURL: 'http://goo.gl/forms/f30sfheh4H',
    helpURL: '/help/using-the-data-browser/',
    showBadgeCounts: false,
    recordUiGridEnabled: false,
    recordUiGridExportCSVEnabled: true,
    recordUiGridExportPDFEnabled: true,
    tour: {
      pickRandom: false,
      searchInputAttribute: "Data",
      searchChosenAttribute: "Data Type",
      searchInputValue: "micro",
      extraAttribute: "Mouse Anatomic Source",
      chosenAttribute: "Data Type",
      chosenValue: "Expression microarray - gene"
    }
};
