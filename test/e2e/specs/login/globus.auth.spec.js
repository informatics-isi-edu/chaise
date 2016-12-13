
describe('Globus login module', function() {
	var EC = protractor.ExpectedConditions, currentUrl;
    beforeAll(function (done) {
        browser.get('/chaise/search');
        var sidebar = element(by.id('sidebar'));
        browser.getCurrentUrl().then(function(u) {
        	url = u;
        	var login_link = browser.driver.findElement(by.id('login_link'));
	        login_link.click();
	        browser.sleep(browser.params.defaultTimeout);
	        done();
        });
    });

	it('allows the user to login', function () {

	    // at this point our server redirects to globus auth page, so let's enter the institution name and press continue bitton
	    browser.driver.executeScript('$("#identity_provider").selectize()[0].selectize.setValue($("#identity_provider").selectize()[0].selectize.search("University of southern california").items[0].id);');

	    var continueButton = browser.driver.findElement(by.id('login-btn'));

	    continueButton.click();

	    browser.sleep(browser.params.defaultTimeout);

	    var logonButton = browser.driver.findElement(by.id('wayflogonbutton'));
	    logonButton.click();

	    browser.ignoreSynchronization = true;
	    browser.sleep(browser.params.defaultTimeout);

	    // at this point our server redirects to USC auth page, so let's log in
	    var emailInput = browser.driver.findElement(by.id('j_username'));
	    emailInput.sendKeys('cksanghv');

	    var passwordInput = browser.driver.findElement(by.id('j_password'));
	    passwordInput.sendKeys('');  //you should not commit this to VCS

	    var signInButton = element(by.css("#loginform button[type='submit']"));
	    signInButton.click();

	    browser.sleep(browser.params.defaultTimeout);

	    it("and redirect to original page", function() {
		    expect(browser.getCurrentUrl()).toEqual(url);
		});
	});

	it("check user login status", function() {
		browser.ignoreSynchronization = false;
		var userIdElement = browser.driver.findElement(by.id('login_user'));
	    expect(userIdElement.isDisplayed()).toBe(true);
	    expect(userIdElement.getText()).not.toBe('');
	    expect(userIdElement.getText()).toBe('cksanghv@usc.edu');
	});
});
