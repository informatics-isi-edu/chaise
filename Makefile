# Makefile rules

# Disable built-in rules
.SUFFIXES:

# Install directory on dev.isrd
CHAISEDIR?=/var/www/html/chaise

# Project name
PROJ=chaise

# Node module dependencies
MODULES=node_modules

# Node bin scripts
BIN=$(MODULES)/.bin

### Protractor scripts
## Sequential protractor scripts
# Legacy apps tests
E2Esearch=test/e2e/specs/default-config/search/presentation.conf.js
E2EDdetailed=test/e2e/specs/detailed/data-dependent/protractor.conf.js
# Recordedit tests
E2EDIrecordAdd=test/e2e/specs/all-features-confirmation/recordedit/add.conf.js
E2EDIrecordEditMultiColTypes=test/e2e/specs/default-config/recordedit/multi-col-types.conf.js
E2EDIrecordDefaults=test/e2e/specs/default-config/recordedit/add-defaults.conf.js
E2EDIrecordEdit=test/e2e/specs/all-features-confirmation/recordedit/edit-delete.conf.js
E2ErecordEditNoDeleteBtn=test/e2e/specs/delete-prohibited/recordedit/no-delete-btn.conf.js
E2EDIrecordMultiAdd=test/e2e/specs/default-config/recordedit/add-x-forms.conf.js
E2EDIrecordMultiEdit=test/e2e/specs/default-config/recordedit/multi-edit.conf.js
E2EDrecordEditCompositeKey=test/e2e/specs/default-config/recordedit/composite-key.conf.js
E2EDrecordEditDomainFilter=test/e2e/specs/default-config/recordedit/domain-filter.conf.js
E2EDrecordEditSubmissionDisabled=test/e2e/specs/default-config/recordedit/submission-disabled.conf.js
# Record tests
E2EDrecord=test/e2e/specs/all-features-confirmation/record/presentation-btn.conf.js
E2EDrecordCopy=test/e2e/specs/all-features/record/copy-btn.conf.js
E2ErecordNoDeleteBtn=test/e2e/specs/delete-prohibited/record/no-delete-btn.conf.js
E2EDrecordRelatedTable=test/e2e/specs/all-features/record/related-table.conf.js
# Recordset tests
E2EDrecordset=test/e2e/specs/all-features-confirmation/recordset/presentation.conf.js
E2EDrecordsetEdit=test/e2e/specs/default-config/recordset/edit.conf.js
E2ErecordsetAdd=test/e2e/specs/default-config/recordset/add.conf.js
E2EDrecordsetIndFacet=test/e2e/specs/delete-prohibited/recordset/ind-facet.conf.js
# Viewer tests
E2EDviewer=test/e2e/specs/all-features/viewer/presentation.conf.js
# misc tests
E2Enavbar=test/e2e/specs/all-features/navbar/protractor.conf.js
E2EnavbarHeadTitle=test/e2e/specs/all-features-confirmation/navbar/protractor.conf.js
E2EmultiPermissionsVisibility=test/e2e/specs/all-features/permissions-visibility.conf.js
# footer test
E2Efooter=test/e2e/specs/all-features-confirmation/footer/protractor.conf.js
## Parallel protractor scripts
FullFeaturesParallel=test/e2e/specs/all-features/protractor.conf.js
FullFeaturesConfirmationParallel=test/e2e/specs/all-features-confirmation/protractor.conf.js
DeleteProhibitedParallel=test/e2e/specs/delete-prohibited/protractor.conf.js
DefaultConfigParallel=test/e2e/specs/default-config/protractor.conf.js


NAVBAR_TESTS=$(E2Enavbar) $(E2EnavbarHeadTitle)
SEARCH_TESTS=$(E2Esearch)
DETAILED_TESTS=$(E2EDdetailed)
RECORDSET_TESTS=$(E2EDrecordset) $(E2ErecordsetAdd) $(E2EDrecordsetEdit) $(E2EDrecordsetIndFacet)
RECORD_TESTS=$(E2EDrecord) $(E2ErecordNoDeleteBtn) $(E2EDrecordRelatedTable) $(E2EDrecordCopy)
RECORDADD_TESTS=$(E2EDIrecordAdd) $(E2EDIrecordMultiAdd) $(E2EDIrecordDefaults)
RECORDEDIT_TESTS=$(E2EDIrecordEdit) $(E2EDIrecordMultiEdit) $(E2EDrecordEditCompositeKey) $(E2ErecordEditNoDeleteBtn) $(E2EDrecordEditSubmissionDisabled) $(E2EDIrecordEditMultiColTypes) $(E2EDrecordEditDomainFilter)
PERMISSIONS_TESTS=$(E2EmultiPermissionsVisibility)
FOOTER_TESTS=$(E2Efooter)
DEFAULT_CONFIG_PARALLEL_TESTS=$(DefaultConfigParallel)
DELETE_PROHIBITED_PARALLEL_TESTS=$(DeleteProhibitedParallel)
FULL_FEATURES_CONFIRMATION_PARALLEL_TESTS=$(FullFeaturesConfirmationParallel)
FULL_FEATURES_PARALLEL_TESTS=$(FullFeaturesParallel)
PARALLEL_TESTS=$(FullFeaturesParallel) $(FullFeaturesConfirmationParallel) $(DeleteProhibitedParallel) $(DefaultConfigParallel)
VIEWER_TESTS=$(E2EDviewer)

ALL_TESTS=$(NAVBAR_TESTS) $(RECORD_TESTS) $(RECORDSET_TESTS) $(RECORDADD_TESTS) $(RECORDEDIT_TESTS) $(PERMISSIONS_TESTS) $(VIEWER_TESTS) $(SEARCH_TESTS) $(FOOTER_TESTS)

define make_test
	rc=0; \
	for file in $(1); do \
		$(BIN)/protractor $$file || rc=1; \
	done; \
	exit $$rc;
endef

test-%: deps
	$(call make_test, $($*), "0")

#### Sequential make commands - these commands will run tests in sequential order
#Rule to run navbar tests
.PHONY: testnavbar
testnavbar: test-NAVBAR_TESTS

#Rule to run search app tests
.PHONY: testsearch
testsearch: test-SEARCH_TESTS

#Rule to run record app tests
.PHONY: testrecord
testrecord: test-RECORD_TESTS

#Rule to run record add app tests
.PHONY: testrecordadd
testrecordadd: test-RECORDADD_TESTS

# Rule to run record edit app tests
.PHONY: testrecordedit
testrecordedit: test-RECORDEDIT_TESTS

.PHONY: testpermissions
testpermissions:test-PERMISSIONS_TESTS

#Rule to run viewer app tests
.PHONY: testviewer
testviewer: test-VIEWER_TESTS

#Rule to run detailed app tests
.PHONY: testdetailed
testdetailed: test-DETAILED_TESTS

#Rule to run recordset app tests
.PHONY: testrecordset
testrecordset: test-RECORDSET_TESTS

#### Parallel make commands - these commands will run tests in parallel
#Rule to run all parallel test configurations
.PHONY: testparallel
testparallel: test-PARALLEL_TESTS

#Rule to run the full features chaise configuration tests in parallel
.PHONY: testfullfeatures
testfullfeatures: test-FULL_FEATURES_PARALLEL_TESTS

#Rule to run the full features chaise configuration tests in parallel
.PHONY: testfullfeaturesconfirmation
testfullfeaturesconfirmation: test-FULL_FEATURES_CONFIRMATION_PARALLEL_TESTS

#Rule to run the delete prohibited chaise configuration tests in parallel
.PHONY: testdeleteprohibited
testdeleteprohibited: test-DELETE_PROHIBITED_PARALLEL_TESTS

#Rule to run the default chaise configuration tests in parallel
.PHONY: testdefaultconfig
testdefaultconfig: test-DEFAULT_CONFIG_PARALLEL_TESTS

#Rule to run the default chaise configuration tests in parallel
.PHONY: testfooter
testfooter: test-FOOTER_TESTS	

# Rule to run tests
.PHONY: test
test: test-ALL_TESTS

# Rule to run karma
.PHONY: karma
karma: deps
	$(BIN)/karma start

# Rule to run tests
.PHONY: testall
testall: test karma

# Rule to determine MD5 utility
ifeq ($(shell which md5 2>/dev/null),)
    MD5 = md5sum
else
    MD5 = md5 -q
endif

CAT=cat

# HTML
HTML=search/index.html \
	 login/index.html \
	 detailed/index.html \
	 recordset/index.html \
	 viewer/index.html \
	 recordedit/index.html \
	 record/index.html \
	 recordedit/mdHelp.html

# ERMrestjs Deps
ERMRESTJS_RT_DIR=../../ermrestjs
ERMRESTJS_BLD_DIR=../ermrestjs/build
ERMRESTJS_DEPS=ermrest.js

# Shared utilities
COMMON=common

# Markdown Editor dependencies
MDEDIT_CSS_DEPS=$(COMMON)/vendor/MarkdownEditor/styles/bootstrap-markdown.min.css \
	$(COMMON)/vendor/MarkdownEditor/styles/github.min.css \
	$(COMMON)/vendor/MarkdownEditor/styles/angular-markdown-editor.min.css

MDEDIT_JS_DEPS=$(COMMON)/vendor/MarkdownEditor/bootstrap-markdown.js \
	$(COMMON)/vendor/MarkdownEditor/highlight.min.js \
	$(COMMON)/vendor/MarkdownEditor/angular-highlightjs.min.js \
	$(COMMON)/vendor/MarkdownEditor/angular-markdown-editor.js

# CSS source
CSS=styles

CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/vendor/ng-grid.css \
	$(CSS)/vendor/rzslider.css \
	$(CSS)/vendor/select.css \
	$(CSS)/vendor/select2.css \
	$(CSS)/vendor/angular-datepicker.css \
	$(CSS)/vendor/bootstrap-tour.min.css

CSS_SOURCE=$(CSS)/swoop-sidebar.css \
	$(CSS)/jquery.nouislider.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(CSS)/ermrest.css \
	$(CSS)/app.css \
	$(COMMON)/styles/appheader.css \
	$(CSS)/tour.css

# JavaScript source and test specs
JS=scripts

JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/jquery-ui-tooltip.min.js \
	$(JS)/vendor/jquery.nouislider.all.min.js \
	$(JS)/vendor/bootstrap.min.js \
	$(JS)/vendor/jquery.cookie.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js \
	$(JS)/vendor/ui-bootstrap-tpls.js \
	$(COMMON)/vendor/angular-cookies.min.js \
	$(JS)/vendor/rzslider.js \
	$(JS)/vendor/angular-datepicker.js \
	$(JS)/vendor/ng-grid.js \
	$(JS)/vendor/select.js \
	$(JS)/vendor/bootstrap-tour.min.js \
	$(JS)/vendor/plotly-latest.min.js


JS_SOURCE=$(JS)/respond.js \
	$(JS)/variables.js \
	$(JS)/utils.js \
	$(JS)/ermrest.js \
	$(JS)/app.js \
	$(JS)/facetsModel.js \
	$(JS)/facetsService.js \
	$(JS)/controller/ermrestDetailController.js \
	$(JS)/controller/ermrestFilterController.js \
	$(JS)/controller/ermrestInitController.js \
	$(JS)/controller/ermrestLoginController.js \
	$(JS)/controller/ermrestResultsController.js \
	$(JS)/controller/ermrestSideBarController.js \
	$(JS)/controller/ermrestTourController.js \
	$(JS)/tour.js \
	$(COMMON)/alerts.js \
	$(COMMON)/authen.js \
	$(COMMON)/delete-link.js \
	$(COMMON)/errors.js \
	$(COMMON)/errorDialog.controller.js \
	$(COMMON)/filters.js \
	$(COMMON)/modal.js \
	$(COMMON)/navbar.js \
	$(COMMON)/record.js \
	$(COMMON)/ellipses.js \
	$(COMMON)/table.js \
	$(COMMON)/utils.js \
	$(COMMON)/bindHtmlUnsafe.js

# HTML templates
TEMPLATES=views

TEMPLATES_DEPS=$(TEMPLATES)/erminit.html \
	$(TEMPLATES)/ermsidebar.html \
	$(TEMPLATES)/ermretrievefilters.html \
	$(TEMPLATES)/ermretrieveresults.html

DETAILED_TEMPLATES=detailed/assets/views/detailed.html
RECSET_TEMPLATES_DEPS=recordset/recordset.html

# JavaScript and CSS source for Record app
DETAILED_ASSETS=detailed/assets

DETAILED_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/jquery.cookie.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js \
	$(JS)/vendor/bootstrap.js \
	$(COMMON)/authen.js \
	$(COMMON)/navbar.js

DETAILED_JS_DEPS=$(DETAILED_ASSETS)/lib/angular-route.min.js \
	$(DETAILED_ASSETS)/lib/angular-resource.min.js \
	$(DETAILED_ASSETS)/lib/angular-animate.min.js \
	$(DETAILED_ASSETS)/lib/angular-cookies.min.js \
	$(DETAILED_ASSETS)/lib/ui-bootstrap-tpls-0.12.1.min.js \
	$(DETAILED_ASSETS)/lib/filesize.min.js \
	$(DETAILED_ASSETS)/lib/slippry/slippry.min.js \
	$(DETAILED_ASSETS)/lib/fancybox/jquery.fancybox.pack.js \
	$(DETAILED_ASSETS)/lib/jquery.floatThead.min.js \
    $(DETAILED_ASSETS)/lib/ui-grid.js \
    $(DETAILED_ASSETS)/lib/csv.js \
    $(DETAILED_ASSETS)/lib/pdfmake.min.js \
    $(DETAILED_ASSETS)/lib/vfs_fonts.js \
    $(DETAILED_ASSETS)/lib/marked.min.js

DETAILED_JS_SOURCE= $(JS)/respond.js \
	$(JS)/variables.js \
	$(JS)/utils.js \
	$(JS)/ermrest.js \
	$(COMMON)/utils.js \
	$(DETAILED_ASSETS)/javascripts/app.js

DETAILED_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(COMMON)/styles/appheader.css

DETAILED_CSS_DEPS=$(DETAILED_ASSETS)/lib/slippry/slippry.css \
	$(DETAILED_ASSETS)/lib/fancybox/jquery.fancybox.css \
	$(DETAILED_ASSETS)/stylesheets/ui-grid.css

DETAILED_CSS_SOURCE=$(COMMON)/styles/app.css

# JavaScript and CSS source for Record(2) app
RECORD_ASSETS=record

RECORD_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-messages.min.js \
	$(JS)/vendor/angular-sanitize.js \
	$(COMMON)/vendor/angular-cookies.min.js \
	$(COMMON)/vendor/angular-animate.min.js \
	$(COMMON)/alerts.js \
	$(COMMON)/authen.js \
	$(COMMON)/delete-link.js \
	$(COMMON)/errors.js \
	$(COMMON)/errorDialog.controller.js \
	$(COMMON)/filters.js \
	$(COMMON)/modal.js \
	$(COMMON)/navbar.js \
	$(COMMON)/record.js \
	$(COMMON)/ellipses.js \
	$(COMMON)/table.js \
	$(COMMON)/utils.js \
	$(COMMON)/bindHtmlUnsafe.js \
	$(COMMON)/footer.js \
	$(COMMON)/upload.js \
	$(COMMON)/recordCreate.js \
	$(JS)/vendor/bootstrap.js \
	$(JS)/vendor/ui-bootstrap-tpls.js

RECORD_JS_SOURCE=$(RECORD_ASSETS)/record.app.js \
	$(RECORD_ASSETS)/record.controller.js

RECORD_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(COMMON)/styles/app.css \
	$(COMMON)/styles/appheader.css

RECORD_CSS_SOURCE=$(RECORD_ASSETS)/record.css

# JavaScript and CSS source for Viewer app
VIEWER_ASSETS=viewer

VIEWER_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js \
	$(COMMON)/alerts.js \
	$(COMMON)/filters.js \
	$(COMMON)/utils.js \
	$(COMMON)/authen.js \
	$(COMMON)/errors.js \
	$(COMMON)/modal.js \
	$(COMMON)/delete-link.js \
	$(COMMON)/vendor/re-tree.js \
	$(COMMON)/vendor/ng-device-detector.js \
	$(COMMON)/vendor/angular-cookies.min.js \
	$(JS)/vendor/bootstrap.js \
	$(JS)/vendor/ui-bootstrap-tpls.js \
	$(JS)/vendor/select.js

VIEWER_JS_SOURCE=$(VIEWER_ASSETS)/viewer.app.js \
	$(VIEWER_ASSETS)/common/providers/context.js \
	$(VIEWER_ASSETS)/common/providers/image.js \
	$(VIEWER_ASSETS)/common/providers/user.js \
	$(VIEWER_ASSETS)/common/providers/auth.service.js \
	$(VIEWER_ASSETS)/sidebar/sidebar.controller.js \
	$(VIEWER_ASSETS)/annotations/annotations.js \
	$(VIEWER_ASSETS)/annotations/comments.js \
	$(VIEWER_ASSETS)/annotations/anatomies.js \
	$(VIEWER_ASSETS)/annotations/annotations.service.js \
	$(VIEWER_ASSETS)/annotations/comments.service.js \
	$(VIEWER_ASSETS)/annotations/annotations.controller.js \
	$(VIEWER_ASSETS)/annotations/comments.controller.js \
	$(VIEWER_ASSETS)/osd/osd.controller.js \
	$(VIEWER_ASSETS)/image-metadata/vocabs.js \
	$(VIEWER_ASSETS)/image-metadata/statuses.js \
	$(VIEWER_ASSETS)/image-metadata/metadata.controller.js \
	$(VIEWER_ASSETS)/alerts/alerts.controller.js

VIEWER_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(CSS)/vendor/select.css \
	$(CSS)/vendor/select2.css \
	$(COMMON)/styles/app.css \
	$(COMMON)/styles/appheader.css

VIEWER_CSS_SOURCE=$(VIEWER_ASSETS)/viewer.css

# JavaScript and CSS source for RecordEdit app
RE_ASSETS=recordedit

RE_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js \
	$(JS)/vendor/angular-messages.min.js \
	$(COMMON)/vendor/angular-cookies.min.js \
	$(COMMON)/vendor/mask.min.js \
	$(COMMON)/vendor/moment.min.js \
	$(COMMON)/vendor/sparkMD5.min.js \
	$(COMMON)/alerts.js \
	$(COMMON)/authen.js \
	$(COMMON)/errors.js \
	$(COMMON)/filters.js \
	$(COMMON)/ellipses.js \
	$(COMMON)/table.js \
	$(COMMON)/utils.js \
	$(COMMON)/upload.js \
	$(COMMON)/validators.js \
	$(COMMON)/navbar.js \
	$(COMMON)/errorDialog.controller.js \
	$(COMMON)/modal.js \
	$(COMMON)/delete-link.js \
	$(COMMON)/bindHtmlUnsafe.js \
	$(COMMON)/markdownPreview.js \
	$(COMMON)/footer.js \
	$(COMMON)/recordCreate.js \
	$(JS)/vendor/bootstrap.js \
	$(JS)/vendor/ui-bootstrap-tpls.js \
	$(JS)/vendor/select.js \
	$(JS)/vendor/angular-datepicker.js \
	$(JS)/vendor/rzslider.js


RE_JS_SOURCE=$(RE_ASSETS)/recordEdit.app.js \
	$(RE_ASSETS)/model.js \
	$(RE_ASSETS)/form.controller.js

RE_JS_MDHELP=$(RE_ASSETS)/mdHelp.controller.js


RE_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(CSS)/vendor/select.css \
	$(CSS)/vendor/select2.css \
	$(CSS)/vendor/angular-datepicker.css \
	$(CSS)/vendor/rzslider.css \
	$(COMMON)/styles/app.css \
	$(COMMON)/styles/appheader.css

RE_CSS_SOURCE=$(RE_ASSETS)/recordEdit.css

RE_CSS_MDHELP=$(RE_ASSETS)/mdHelpStyle.min.css

# JavaScript and CSS source for RecordSet app
RECSET_ASSETS=recordset

RECSET_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/plotly-latest.min.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-plotly.js \
	$(JS)/vendor/angular-sanitize.js \
	$(JS)/vendor/bootstrap.js \
	$(JS)/vendor/ui-bootstrap-tpls.js \
	$(COMMON)/vendor/angular-animate.min.js \
	$(COMMON)/vendor/angular-scroll.min.js \
	$(COMMON)/alerts.js \
	$(COMMON)/bindHtmlUnsafe.js \
	$(COMMON)/ellipses.js \
	$(COMMON)/errors.js \
	$(COMMON)/errorDialog.controller.js \
	$(COMMON)/faceting.js \
	$(COMMON)/filters.js \
	$(COMMON)/footer.js \
	$(COMMON)/inputs.js \
	$(COMMON)/modal.js \
	$(COMMON)/navbar.js \
	$(COMMON)/resizable.js \
	$(COMMON)/table.js \
	$(COMMON)/validators.js \
	$(COMMON)/vendor/angular-cookies.min.js

RECSET_JS_SOURCE=$(COMMON)/authen.js \
    $(COMMON)/utils.js \
    $(RECSET_ASSETS)/recordset.js

RECSET_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css

RECSET_CSS_SOURCE=$(COMMON)/styles/app.css \
    $(COMMON)/styles/appheader.css

# Config file
JS_CONFIG=chaise-config.js

# Distribution target
DIST=dist

# Project package full/minified
PKG=$(DIST)/$(PROJ).js
MIN=$(DIST)/$(PROJ).min.js

# Documentation target
DOC=doc
API=$(DOC)/api.md
JSDOC=jsdoc

# Hidden target files (for make only)
LINT=.make-lint

.PHONY: all
# all should just do the minimal needed to deploy chaise
all: $(HTML)

.PHONY: build
build: $(PKG) $(MIN) $(HTML) $(gitversion)

# Rule to build the full library
$(PKG): $(JS_SOURCE) $(BIN)
	mkdir -p $(DIST)
	cat $(JS_SOURCE) > $(PKG)

# Rule to build the minified package
$(MIN): $(JS_SOURCE) $(BIN)
	mkdir -p $(DIST)
	$(BIN)/ccjs $(JS_SOURCE) > $(MIN)

# Rule to lint the source (only changed source is linted)
$(LINT): $(JS_SOURCE) $(BIN)
	$(BIN)/jshint $(filter $(JS_SOURCE), $?)
	@touch $(LINT)

.PHONY: lint
lint: $(LINT)

# Rule for making markdown docs
$(DOC): $(API)

# Rule for making API doc
$(API): $(JS_SOURCE) $(BIN)
	mkdir -p $(DOC)
	$(BIN)/jsdoc2md $(JS_SOURCE) > $(API)

# jsdoc: target for html docs produced (using 'jsdoc')
$(JSDOC): $(JS_SOURCE) $(BIN)
	mkdir -p $(JSDOC)
	$(BIN)/jsdoc --pedantic -d $(JSDOC) $(JS_SOURCE)
	@touch $(JSDOC)

# Rule to ensure Node bin scripts are present
$(BIN): $(MODULES)
	node_modules/protractor/bin/webdriver-manager update

# Rule to install Node modules locally
$(MODULES): package.json
	npm install

.PHONY: deps
deps: $(BIN)

.PHONY: updeps
updeps:
	npm update

# Rule to clean project directory
.PHONY: clean
clean:
	rm $(HTML) || true
	rm -rf $(DIST)
	rm -rf $(JSDOC)
	rm -f .make-*

# Rule to clean the dependencies too
.PHONY: distclean
distclean: clean
	rm -rf $(MODULES)


# Rule to make html
.PHONY: html
html: $(HTML)

# Rules to attach JavaScript and CSS assets to the head
search/index.html: search/index.html.in .make-asset-block .make-template-block
	sed -e '/%ASSETS%/ {' -e 'r .make-asset-block' -e 'd' -e '}' \
		-e '/%TEMPLATES%/ {' -e 'r .make-template-block' -e 'd' -e '}' \
		search/index.html.in > search/index.html

login/index.html: login/index.html.in .make-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-asset-block' -e 'd' -e '}' \
		login/index.html.in > login/index.html

detailed/index.html: detailed/index.html.in .make-detailed-asset-block .make-detailed-template-block
	sed -e '/%ASSETS%/ {' -e 'r .make-detailed-asset-block' -e 'd' -e '}' \
		-e '/%TEMPLATES%/ {' -e 'r .make-detailed-template-block' -e 'd' -e '}' \
		detailed/index.html.in > detailed/index.html

record/index.html: record/index.html.in .make-record-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-record-asset-block' -e 'd' -e '}' \
		record/index.html.in > record/index.html

recordset/index.html: recordset/index.html.in .make-rs-asset-block .make-rs-template-block
	sed -e '/%ASSETS%/ {' -e 'r .make-rs-asset-block' -e 'd' -e '}' \
		-e '/%TEMPLATES%/ {' -e 'r .make-rs-template-block' -e 'd' -e '}' \
		recordset/index.html.in > recordset/index.html

viewer/index.html: viewer/index.html.in .make-viewer-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-viewer-asset-block' -e 'd' -e '}' \
		viewer/index.html.in > viewer/index.html

recordedit/index.html: recordedit/index.html.in .make-de-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-de-asset-block' -e 'd' -e '}' \
		recordedit/index.html.in > recordedit/index.html

recordedit/mdHelp.html: recordedit/mdHelp.html.in .make-md-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-md-asset-block' -e 'd' -e '}' \
	recordedit/mdHelp.html.in > recordedit/mdHelp.html

$(JS_CONFIG): chaise-config-sample.js
	cp -n chaise-config-sample.js $(JS_CONFIG) || true
	touch $(JS_CONFIG)

.make-asset-block: $(CSS_DEPS) $(CSS_SOURCE) $(JS_DEPS) $(JS_SOURCE) $(JS_CONFIG)
	> .make-asset-block
	for file in $(CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-asset-block ; \
	done
	for file in $(CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-asset-block ; \
	done
	for file in $(JS_CONFIG) $(JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-asset-block ; \
	done
	for file in $(JS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-asset-block ; \
	done

.make-detailed-asset-block: $(DETAILED_SHARED_CSS_DEPS) $(DETAILED_CSS_DEPS) $(DETAILED_CSS_SOURCE) $(DETAILED_SHARED_JS_DEPS) $(DETAILED_JS_DEPS) $(DETAILED_JS_SOURCE) $(JS_CONFIG)
	> .make-detailed-asset-block
	for file in $(DETAILED_SHARED_CSS_DEPS) $(DETAILED_CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-detailed-asset-block ; \
	done
	for file in $(DETAILED_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-detailed-asset-block ; \
	done
	for file in $(JS_CONFIG) $(DETAILED_SHARED_JS_DEPS) $(DETAILED_JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-detailed-asset-block ; \
	done
	for file in $(DETAILED_JS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-detailed-asset-block ; \
	done

.make-template-block: $(TEMPLATES_DEPS)
	> .make-template-block
	for file in $(TEMPLATES_DEPS); do \
		$(CAT) $$file >> .make-template-block ; \
	done

.make-rs-template-block: $(RECSET_TEMPLATES_DEPS)
	> .make-rs-template-block
	for file in $(RECSET_TEMPLATES_DEPS); do \
		$(CAT) $$file >> .make-rs-template-block ; \
	done

.make-detailed-template-block: $(DETAILED_TEMPLATES)
	> .make-detailed-template-block
	for file in $(DETAILED_TEMPLATES); do \
		$(CAT) $$file >> .make-detailed-template-block; \
	done

.make-viewer-asset-block: $(VIEWER_SHARED_CSS_DEPS) $(VIEWER_CSS_SOURCE) $(VIEWER_SHARED_JS_DEPS) $(VIEWER_JS_SOURCE) $(JS_CONFIG)
	> .make-viewer-asset-block
	for file in $(VIEWER_SHARED_CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-viewer-asset-block ; \
	done
	for file in $(VIEWER_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-viewer-asset-block ; \
	done
	for file in $(JS_CONFIG) $(VIEWER_SHARED_JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-viewer-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		buildpath=$(ERMRESTJS_BLD_DIR)/$$script ; \
		runtimepath=$(ERMRESTJS_RT_DIR)/$$script ; \
		checksum=$$($(MD5) $$buildpath | awk '{ print $$1 }') ; \
		echo "<script src='$$runtimepath?v=$$checksum'></script>" >> .make-viewer-asset-block ; \
	done
	for file in $(VIEWER_JS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-viewer-asset-block ; \
	done

.make-de-asset-block: $(RE_SHARED_CSS_DEPS) $(RE_CSS_SOURCE) $(RE_SHARED_JS_DEPS) $(RE_JS_SOURCE) $(JS_CONFIG) $(MDEDIT_JS_DEPS) $(MDEDIT_CSS_DEPS)
	> .make-de-asset-block
	for file in $(RE_SHARED_CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-de-asset-block ; \
	done
	for file in $(RE_CSS_SOURCE) $(MDEDIT_CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-de-asset-block ; \
	done
	for file in $(JS_CONFIG) $(RE_SHARED_JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-de-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		buildpath=$(ERMRESTJS_BLD_DIR)/$$script ; \
		runtimepath=$(ERMRESTJS_RT_DIR)/$$script ; \
		checksum=$$($(MD5) $$buildpath | awk '{ print $$1 }') ; \
		echo "<script src='$$runtimepath?v=$$checksum'></script>" >> .make-de-asset-block ; \
	done
	for file in $(RE_JS_SOURCE) $(MDEDIT_JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-de-asset-block ; \
	done

.make-rs-asset-block: $(RECSET_SHARED_CSS_DEPS) $(RECSET_CSS_SOURCE) $(RECSET_SHARED_JS_DEPS) $(RECSET_JS_SOURCE) $(JS_CONFIG)
	> .make-rs-asset-block
	for file in $(RECSET_SHARED_CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-rs-asset-block ; \
	done
	for file in $(RECSET_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-rs-asset-block ; \
	done
	for file in $(JS_CONFIG) $(RECSET_SHARED_JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-rs-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		buildpath=$(ERMRESTJS_BLD_DIR)/$$script ; \
		runtimepath=$(ERMRESTJS_RT_DIR)/$$script ; \
		checksum=$$($(MD5) $$buildpath | awk '{ print $$1 }') ; \
		echo "<script src='$$runtimepath?v=$$checksum'></script>" >> .make-rs-asset-block ; \
	done
	for file in $(RECSET_JS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-rs-asset-block ; \
	done

.make-record-asset-block: $(RECORD_SHARED_CSS_DEPS) $(RECORD_CSS_SOURCE) $(RECORD_SHARED_JS_DEPS) $(RECORD_JS_SOURCE) $(JS_CONFIG)
	> .make-record-asset-block
	for file in $(RECORD_SHARED_CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-record-asset-block ; \
	done
	for file in $(JS_CONFIG) $(RECORD_SHARED_JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-record-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		buildpath=$(ERMRESTJS_BLD_DIR)/$$script ; \
		runtimepath=$(ERMRESTJS_RT_DIR)/$$script ; \
		checksum=$$($(MD5) $$buildpath | awk '{ print $$1 }') ; \
		echo "<script src='$$runtimepath?v=$$checksum'></script>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_JS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-record-asset-block ; \
	done

.make-md-asset-block: $(RE_SHARED_CSS_DEPS) $(RE_SHARED_JS_DEPS) $(JS_CONFIG) $(RE_JS_MDHELP) $(RE_CSS_MDHELP)
	> .make-md-asset-block
	for file in $(RE_SHARED_CSS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-md-asset-block ; \
	done
	for file in $(RE_CSS_MDHELP); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-md-asset-block ; \
	done
	for file in $(JS_CONFIG) $(RE_SHARED_JS_DEPS); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-md-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		buildpath=$(ERMRESTJS_BLD_DIR)/$$script ; \
		runtimepath=$(ERMRESTJS_RT_DIR)/$$script ; \
		checksum=$$($(MD5) $$buildpath | awk '{ print $$1 }') ; \
		echo "<script src='$$runtimepath?v=$$checksum'></script>" >> .make-md-asset-block ; \
	done
	for file in $(RE_JS_MDHELP); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-md-asset-block ; \
	done

# Rule for installing for normal deployment
.PHONY: install dont_install_in_root
install: $(HTML) dont_install_in_root gitversion
	rsync -avz --exclude='.*' --exclude='$(MODULES)' --exclude='wiki-images' --exclude=/chaise-config.js . $(CHAISEDIR)

.PHONY: gitversion
gitversion:
	sh ./git_version_info.sh

dont_install_in_root:
	@echo "$(CHAISEDIR)" | egrep -vq "^/$$|.*:/$$"

# Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Available 'make' targets:"
	@echo "    all       		- an alias for build"
	@echo "    install          - installs the client (CHAISEDIR=$(CHAISEDIR))"
	@echo "    deps      		- local install of node dependencies"
	@echo "    updeps    		- update local dependencies"
	@echo "    lint      		- lint the source"
	@echo "    build     		- builds the package"
	@echo "    test      		- runs e2e tests"
	@echo "    karma     		- runs the karma tests (only a scaffolding at present)"
	@echo "    testall   		- runs e2e and Karma tests"
	@echo "    doc       		- make autogenerated markdown docs"
	@echo "    jsdoc     		- make autogenerated html docs"
	@echo "    clean     		- cleans the dist dir"
	@echo "    distclean 		- cleans the dist dir and the dependencies"
	@echo "    testsearch 		- runs search app e2e tests"
	@echo "    testdetailed 	- runs detailed app e2e tests"
	@echo "    testrecordadd 	- runs data entry app add e2e tests"
	@echo "    testrecordedit 	- runs data entry app edit e2e tests"
	@echo "    testrecord 		- runs record app e2e tests"
	@echo "    testrecordset 	- runs recordset app e2e tests"
	@echo "    testviewer   	- runs viewer app e2e tests"
	@echo "    testnavbar   	- runs navbar e2e tests"
	@echo "    testlogin    	- runs login app e2e tests"
