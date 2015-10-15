describe('Chaise search app', function() {
  it('should open the initial sidebar on load', function() {
    browser.get('');
    expect(element(by.css('#sidebar')).getAttribute('class')).toContain('open');
  });
});
