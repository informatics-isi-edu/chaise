# Makefile rules

# Disable built-in rules
.SUFFIXES:

# Install directory on dev.isrd
CHAISEDIR=/var/www/html/chaise

# Install directory on travis
CHAISETRAVISDIR=/var/www/html/chaise

# Project name
PROJ=chaise

# Node module dependencies
MODULES=node_modules

# Node bin scripts
BIN=$(MODULES)/.bin

# Protractor scripts
E2EDIsearch=test/e2e/specs/search/data-independent/protractor.conf.js
E2EDsearch=test/e2e/specs/search/data-dependent/protractor.conf.js
E2EDrecord=test/e2e/specs/record/data-dependent/protractor.conf.js
E2EDIrecordAdd=test/e2e/specs/recordedit/data-independent/add/protractor.conf.js
E2EDIrecordEdit=test/e2e/specs/recordedit/data-independent/edit/protractor.conf.js
E2EDrecord2=test/e2e/specs/record2/data-dependent/protractor.conf.js
E2Elogin=test/e2e/specs/login/protractor.conf.js
E2Enavbar=test/e2e/specs/navbar/data-dependent/protractor.conf.js

# Rule to determine MD5 utility
ifeq ($(shell which md5 2>/dev/null),)
    MD5 = md5sum
else
    MD5 = md5 -q
endif

CAT=cat

# HTML
HTML=search/index.html \
	 logout/index.html \
	 login/index.html \
	 record/index.html \
	 recordset/index.html \
	 matrix/index.html \
	 viewer/index.html \
	 recordedit/index.html \
	 record-two/index.html

# ERMrestjs Deps
ERMRESTJS_DIR=../../ermrestjs
ERMRESTJS_DEPS=$(ERMRESTJS_DIR)/ermrest.js

# Shared utilities
COMMON=common

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
	$(CSS)/matrix.css \
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
	$(JS)/vendor/rzslider.js \
	$(JS)/vendor/angular-datepicker.js \
	$(JS)/vendor/ng-grid.js \
	$(JS)/vendor/select.js \
	$(JS)/vendor/bootstrap-tour.min.js

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
	$(JS)/controller/ermrestLogoutController.js \
	$(JS)/controller/ermrestResultsController.js \
	$(JS)/controller/ermrestSideBarController.js \
	$(JS)/controller/ermrestTourController.js \
	$(JS)/controller/ermrestMatrixController.js \
	$(JS)/tour.js \
	$(JS)/matrix.js \
	$(COMMON)/utils.js \
	$(COMMON)/authen.js \
	$(COMMON)/navbar.js

# HTML templates
TEMPLATES=views

TEMPLATES_DEPS=$(TEMPLATES)/erminit.html \
	$(TEMPLATES)/ermsidebar.html \
	$(TEMPLATES)/ermretrievefilters.html \
	$(TEMPLATES)/ermretrieveresults.html

MATRIX_TEMPLATES_DEPS =$(TEMPLATES)/erminit.html \
    $(TEMPLATES)/ermmatrix.html

RECORD_TEMPLATES=record/assets/views/record.html
RECSET_TEMPLATES_DEPS=recordset/recordset.html

# JavaScript and CSS source for Record app
RECORD_ASSETS=record/assets

RECORD_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/jquery.cookie.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js \
	$(JS)/vendor/bootstrap.js \
	$(COMMON)/authen.js \
	$(COMMON)/navbar.js

RECORD_JS_DEPS=$(RECORD_ASSETS)/lib/angular-route.min.js \
	$(RECORD_ASSETS)/lib/angular-resource.min.js \
	$(RECORD_ASSETS)/lib/angular-animate.min.js \
	$(RECORD_ASSETS)/lib/angular-cookies.min.js \
	$(RECORD_ASSETS)/lib/ui-bootstrap-tpls-0.12.1.min.js \
	$(RECORD_ASSETS)/lib/filesize.min.js \
	$(RECORD_ASSETS)/lib/slippry/slippry.min.js \
	$(RECORD_ASSETS)/lib/fancybox/jquery.fancybox.pack.js \
	$(RECORD_ASSETS)/lib/jquery.floatThead.min.js \
    $(RECORD_ASSETS)/lib/ui-grid.js \
    $(RECORD_ASSETS)/lib/csv.js \
    $(RECORD_ASSETS)/lib/pdfmake.min.js \
    $(RECORD_ASSETS)/lib/vfs_fonts.js \
    $(RECORD_ASSETS)/lib/marked.min.js

RECORD_JS_SOURCE= $(JS)/respond.js \
	$(JS)/variables.js \
	$(JS)/utils.js \
	$(JS)/ermrest.js \
	$(COMMON)/utils.js \
	$(RECORD_ASSETS)/javascripts/app.js

RECORD_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(COMMON)/styles/appheader.css

RECORD_CSS_DEPS=$(RECORD_ASSETS)/lib/slippry/slippry.css \
	$(RECORD_ASSETS)/lib/fancybox/jquery.fancybox.css \
	$(RECORD_ASSETS)/stylesheets/ui-grid.css

RECORD_CSS_SOURCE=$(COMMON)/styles/app.css

# JavaScript and CSS source for Record(2) app
RECORDTWO_ASSETS=record-two

RECORDTWO_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-messages.min.js \
	$(JS)/vendor/angular-sanitize.js \
	$(COMMON)/alerts.js \
	$(COMMON)/authen.js \
	$(COMMON)/errors.js \
	$(COMMON)/modal.js \
	$(COMMON)/navbar.js \
	$(COMMON)/record.js \
	$(COMMON)/table.js \
	$(COMMON)/utils.js \
	$(JS)/vendor/bootstrap.js \
	$(JS)/vendor/ui-bootstrap-tpls.js

RECORDTWO_JS_SOURCE=$(RECORDTWO_ASSETS)/record.app.js \
	$(RECORDTWO_ASSETS)/record.controller.js

RECORDTWO_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(COMMON)/styles/app.css \
	$(COMMON)/styles/appheader.css

RECORDTWO_CSS_SOURCE=$(RECORDTWO_ASSETS)/record.css

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

# JavaScript and CSS source for Data Entry app
RE_ASSETS=recordedit

RE_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js \
	$(JS)/vendor/angular-messages.min.js \
	$(COMMON)/alerts.js \
	$(COMMON)/authen.js \
	$(COMMON)/errors.js \
	$(COMMON)/filters.js \
	$(COMMON)/utils.js \
	$(COMMON)/validators.js \
	$(COMMON)/navbar.js \
	$(COMMON)/errorDialog.controller.js \
	$(COMMON)/modal.js \
	$(COMMON)/delete-link.js \
	$(JS)/vendor/bootstrap.js \
	$(JS)/vendor/ui-bootstrap-tpls.js \
	$(JS)/vendor/select.js \
	$(JS)/vendor/angular-datepicker.js \
	$(JS)/vendor/rzslider.js


RE_JS_SOURCE=$(RE_ASSETS)/recordEdit.app.js \
	$(RE_ASSETS)/context.js \
	$(RE_ASSETS)/model.js \
	$(RE_ASSETS)/form.controller.js

RE_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(CSS)/vendor/select.css \
	$(CSS)/vendor/select2.css \
	$(CSS)/vendor/angular-datepicker.css \
	$(CSS)/vendor/rzslider.css \
	$(COMMON)/styles/app.css \
	$(COMMON)/styles/appheader.css

RE_CSS_SOURCE=$(RE_ASSETS)/recordEdit.css

# JavaScript and CSS source for RecordSet app
RECSET_ASSETS=recordset

RECSET_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
    $(JS)/vendor/jquery.cookie.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/bootstrap.js \
	$(JS)/vendor/ui-bootstrap-tpls.js \
	$(RECORD_ASSETS)/lib/angular-animate.min.js \
	$(COMMON)/alerts.js \
	$(COMMON)/filters.js \
	$(COMMON)/errors.js \
	$(COMMON)/modal.js \
	$(COMMON)/table.js \
	$(COMMON)/navbar.js

RECSET_JS_SOURCE=$(COMMON)/authen.js \
    $(COMMON)/utils.js \
    $(RECSET_ASSETS)/recordset.js

RECSET_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(CSS)/font-awesome/css/font-awesome.min.css

RECSET_CSS_SOURCE=$(RECSET_ASSETS)/app.css \
    $(COMMON)/styles/app.css \
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
build: $(PKG) $(MIN) $(HTML)

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
	node_modules/.bin/webdriver-manager update --standalone

# Rule to install Node modules locally
$(MODULES): package.json
	npm install --force

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

# Rule to run tests
.PHONY: test
test:
	$(BIN)/protractor $(E2Enavbar) && $(BIN)/protractor $(E2EDrecord2) && $(BIN)/protractor $(E2EDIsearch) && $(BIN)/protractor $(E2EDsearch) && $(BIN)/protractor $(E2EDIrecordAdd) && $(BIN)/protractor $(E2EDIrecordEdit) && $(BIN)/protractor $(E2Elogin)

# Rule to run karma
.PHONY: karma
karma:
	$(BIN)/karma start

# Rule to run tests
.PHONY: testall
testall:
	$(BIN)/karma start
	$(BIN)/protractor $(E2Enavbar) && $(BIN)/protractor $(E2EDrecord2) && $(BIN)/protractor $(E2EDIsearch) && $(BIN)/protractor $(E2EDsearch) && $(BIN)/protractor $(E2EDIrecordAdd) && $(BIN)/protractor $(E2EDIrecordEdit) && $(BIN)/protractor $(E2Elogin)

#Rule to run search app tests
.PHONY: testsearch
testsearch:
	$(BIN)/protractor $(E2EDIsearch) && $(BIN)/protractor $(E2EDsearch)

#Rule to run record app tests
.PHONY: testrecord
testrecord:
	$(BIN)/protractor $(E2EDrecord)

#Rule to run record add app tests
.PHONY: testrecordadd
testrecordadd:
	$(BIN)/protractor $(E2EDIrecordAdd)

.PHONY: testrecordedit
testrecordedit:
	$(BIN)/protractor $(E2EDIrecordEdit)

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

logout/index.html: logout/index.html.in .make-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-asset-block' -e 'd' -e '}' \
		logout/index.html.in > logout/index.html

record/index.html: record/index.html.in .make-record-asset-block .make-record-template-block
	sed -e '/%ASSETS%/ {' -e 'r .make-record-asset-block' -e 'd' -e '}' \
		-e '/%TEMPLATES%/ {' -e 'r .make-record-template-block' -e 'd' -e '}' \
		record/index.html.in > record/index.html

record-two/index.html: record-two/index.html.in .make-recordtwo-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-recordtwo-asset-block' -e 'd' -e '}' \
		record-two/index.html.in > record-two/index.html

recordset/index.html: recordset/index.html.in .make-rs-asset-block .make-rs-template-block
	sed -e '/%ASSETS%/ {' -e 'r .make-rs-asset-block' -e 'd' -e '}' \
		-e '/%TEMPLATES%/ {' -e 'r .make-rs-template-block' -e 'd' -e '}' \
		recordset/index.html.in > recordset/index.html

matrix/index.html: matrix/index.html.in .make-asset-block .make-matrix-template-block
	sed -e '/%ASSETS%/ {' -e 'r .make-asset-block' -e 'd' -e '}' \
		-e '/%TEMPLATES%/ {' -e 'r .make-matrix-template-block' -e 'd' -e '}' \
		matrix/index.html.in > matrix/index.html

viewer/index.html: viewer/index.html.in .make-viewer-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-viewer-asset-block' -e 'd' -e '}' \
		viewer/index.html.in > viewer/index.html

recordedit/index.html: recordedit/index.html.in .make-de-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-de-asset-block' -e 'd' -e '}' \
		recordedit/index.html.in > recordedit/index.html

$(JS_CONFIG): chaise-config-sample.js
	cp -n chaise-config-sample.js $(JS_CONFIG) || true
	touch $(JS_CONFIG)

.make-asset-block: $(CSS_DEPS) $(CSS_SOURCE) $(JS_DEPS) $(JS_SOURCE) $(JS_CONFIG)
	> .make-asset-block
	for file in $(CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-asset-block ; \
	done
	for file in $(CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-asset-block ; \
	done
	for file in $(JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-asset-block ; \
	done
	for file in $(JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-asset-block ; \
	done

.make-record-asset-block: $(RECORD_SHARED_CSS_DEPS) $(RECORD_CSS_DEPS) $(RECORD_CSS_SOURCE) $(RECORD_SHARED_JS_DEPS) $(RECORD_JS_DEPS) $(RECORD_JS_SOURCE) $(JS_CONFIG)
	> .make-record-asset-block
	for file in $(RECORD_SHARED_CSS_DEPS) $(RECORD_CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'></script>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_SHARED_JS_DEPS) $(RECORD_JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-record-asset-block ; \
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

.make-matrix-template-block: $(MATRIX_TEMPLATES_DEPS)
	> .make-matrix-template-block
	for file in $(MATRIX_TEMPLATES_DEPS); do \
		$(CAT) $$file >> .make-matrix-template-block ; \
	done

.make-record-template-block: $(RECORD_TEMPLATES)
	> .make-record-template-block
	for file in $(RECORD_TEMPLATES); do \
		$(CAT) $$file >> .make-record-template-block; \
	done

.make-viewer-asset-block: $(VIEWER_SHARED_CSS_DEPS) $(VIEWER_CSS_SOURCE) $(VIEWER_SHARED_JS_DEPS) $(VIEWER_JS_SOURCE) $(JS_CONFIG)
	> .make-viewer-asset-block
	for file in $(VIEWER_SHARED_CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-viewer-asset-block ; \
	done
	for file in $(VIEWER_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-viewer-asset-block ; \
	done
	for file in $(VIEWER_SHARED_JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-viewer-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		echo "<script src='$$script'></script>" >> .make-viewer-asset-block ; \
	done
	for file in $(VIEWER_JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-viewer-asset-block ; \
	done

.make-de-asset-block: $(RE_SHARED_CSS_DEPS) $(RE_CSS_SOURCE) $(RE_SHARED_JS_DEPS) $(RE_JS_SOURCE) $(JS_CONFIG)
	> .make-de-asset-block
	for file in $(RE_SHARED_CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-de-asset-block ; \
	done
	for file in $(RE_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-de-asset-block ; \
	done
	for file in $(RE_SHARED_JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-de-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		echo "<script src='$$script'></script>" >> .make-de-asset-block ; \
	done
	for file in $(RE_JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-de-asset-block ; \
	done

.make-rs-asset-block: $(RECSET_SHARED_CSS_DEPS) $(RECSET_CSS_SOURCE) $(RECSET_SHARED_JS_DEPS) $(RECSET_JS_SOURCE) $(JS_CONFIG)
	> .make-rs-asset-block
	for file in $(RECSET_SHARED_CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-rs-asset-block ; \
	done
	for file in $(RECSET_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-rs-asset-block ; \
	done
	for file in $(RECSET_SHARED_JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-rs-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		echo "<script src='$$script'></script>" >> .make-rs-asset-block ; \
	done
	for file in $(RECSET_JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-rs-asset-block ; \
	done

.make-recordtwo-asset-block: $(RECORDTWO_SHARED_CSS_DEPS) $(RECORDTWO_CSS_SOURCE) $(RECORDTWO_SHARED_JS_DEPS) $(RECORDTWO_JS_SOURCE) $(JS_CONFIG)
	> .make-recordtwo-asset-block
	for file in $(RECORDTWO_SHARED_CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-recordtwo-asset-block ; \
	done
	for file in $(RECORDTWO_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-recordtwo-asset-block ; \
	done
	for file in $(RECORDTWO_SHARED_JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-recordtwo-asset-block ; \
	done
	for script in $(ERMRESTJS_DEPS); do \
		echo "<script src='$$script'></script>" >> .make-recordtwo-asset-block ; \
	done
	for file in $(RECORDTWO_JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-recordtwo-asset-block ; \
	done


# Rule for installing on dev.isrd
.PHONY: install
install: $(HTML)
	test -d $(dir $(CHAISEDIR)) && mkdir -p $(CHAISEDIR)
	rsync -a --exclude='.*' --exclude=chaise-config.js ./. $(CHAISEDIR)/

# Rule for installing on Travis
.PHONY: installTravis
installTravis: $(HTML)
	sudo sh ./git_version_info.sh
	test -d $(dir $(CHAISETRAVISDIR)) && mkdir -p $(CHAISETRAVISDIR)
	rsync -a --exclude='.*' ./. $(CHAISETRAVISDIR)/

# Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Available 'make' targets:"
	@echo "    all       		- an alias for build"
	@echo "    install          - installs the client (CHAISEDIR=$(CHAISEDIR))"
	@echo "    installTravis    - installs the client (CHAISETRAVISDIR=$(CHAISETRAVISDIR))"
	@echo "    deps      		- local install of node dependencies"
	@echo "    updeps    		- update local dependencies"
	@echo "    lint      		- lint the source"
	@echo "    build     		- builds the package"
	@echo "    test      		- runs e2e tests"
	@echo "    karma     		- runs the karma tests"
	@echo "    testall   		- runs e2e and Karma tests"
	@echo "    doc       		- make autogenerated markdown docs"
	@echo "    jsdoc     		- make autogenerated html docs"
	@echo "    clean     		- cleans the dist dir"
	@echo "    distclean 		- cleans the dist dir and the dependencies"
	@echo "    testsearch 		- runs search app e2e tests"
	@echo "    testrecord 		- runs record app e2e tests"
	@echo "    testrecordadd 	- runs data entry add e2e tests"
	@echo "    testrecordedit 	- runs date entry edit e2e tests"
