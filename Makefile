# Makefile rules

# Disable built-in rules
.SUFFIXES:


# make sure NOD_ENV is defined (use production if not defined or invalid)
ifneq ($(NODE_ENV),development)
NODE_ENV:=production
endif

# env variables needed for installation
WEB_URL_ROOT?=/
WEB_INSTALL_ROOT?=/var/www/html/
ERMRESTJS_REL_PATH?=ermrestjs/
CHAISE_REL_PATH?=chaise/
OSD_VIEWER_REL_PATH?=openseadragon-viewer/

# version number added to all the assets
BUILD_VERSION:=$(shell date -u +%Y%m%d%H%M%S)

# where chaise will be deployed
CHAISEDIR:=$(WEB_INSTALL_ROOT)$(CHAISE_REL_PATH)

#chaise and ermrsetjs paths
CHAISE_BASE_PATH:=$(WEB_URL_ROOT)$(CHAISE_REL_PATH)
ERMRESTJS_BASE_PATH:=$(WEB_URL_ROOT)$(ERMRESTJS_REL_PATH)
OSD_VIEWER_BASE_PATH:=$(WEB_URL_ROOT)$(OSD_VIEWER_REL_PATH)

# ERMrestjs dependencies
ERMRESTJS_DEPS=ermrest.vendor.min.js \
	ermrest.min.js

# Project name
PROJ=chaise

# Node module dependencies
MODULES=node_modules

# Node bin scripts
BIN=$(MODULES)/.bin

# ============================================================= #
#						E2E TESTING RULES						#
# ============================================================= #

### Protractor scripts
## Sequential protractor scripts
# Recordedit tests
E2EDIrecordAdd=test/e2e/specs/all-features-confirmation/recordedit/add.conf.js
E2EDIrecordEditMultiColTypes=test/e2e/specs/default-config/recordedit/multi-col-types.conf.js
E2EDIrecordImmutable=test/e2e/specs/default-config/recordedit/immutable-inputs.conf.js
E2EDIrecordEdit=test/e2e/specs/all-features-confirmation/recordedit/edit-delete.conf.js
# not part of the make recordedit command anymore
# E2ErecordEditNoDeleteBtn=test/e2e/specs/delete-prohibited/recordedit/no-delete-btn.conf.js
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
E2EDrecordLinks=test/e2e/specs/default-config/record/links.conf.js
# Recordset tests
E2EDrecordset=test/e2e/specs/all-features-confirmation/recordset/presentation.conf.js
E2EDrecordsetEdit=test/e2e/specs/default-config/recordset/edit.conf.js
E2ErecordsetAdd=test/e2e/specs/default-config/recordset/add.conf.js
E2EDrecordsetIndFacet=test/e2e/specs/delete-prohibited/recordset/ind-facet.conf.js
E2EDrecordsetHistFacet=test/e2e/specs/delete-prohibited/recordset/histogram-facet.conf.js

# misc tests
E2Enavbar=test/e2e/specs/all-features/navbar/protractor.conf.js
E2EnavbarHeadTitle=test/e2e/specs/all-features-confirmation/navbar/protractor.conf.js
E2EnavbarCatalogConfig=test/e2e/specs/delete-prohibited/navbar/protractor.conf.js
E2EmultiPermissionsVisibility=test/e2e/specs/all-features/permissions.conf.js
# footer test
E2Efooter=test/e2e/specs/all-features-confirmation/footer/protractor.conf.js
# errors test
E2Eerrors=test/e2e/specs/all-features-confirmation/errors/protractor.conf.js
## Parallel protractor scripts
FullFeaturesParallel=test/e2e/specs/all-features/protractor.conf.js
FullFeaturesConfirmationParallel=test/e2e/specs/all-features-confirmation/protractor.conf.js
DeleteProhibitedParallel=test/e2e/specs/delete-prohibited/protractor.conf.js
DefaultConfigParallel=test/e2e/specs/default-config/protractor.conf.js
# Setup for manual tests
Manualrecordset=test/manual/specs/recordset.conf.js


NAVBAR_TESTS=$(E2Enavbar) $(E2EnavbarHeadTitle) $(E2EnavbarCatalogConfig)
RECORD_TESTS=$(E2EDrecord) $(E2ErecordNoDeleteBtn) $(E2EDrecordRelatedTable) $(E2EDrecordCopy) $(E2EDrecordLinks)
RECORDSET_TESTS=$(E2EDrecordset) $(E2ErecordsetAdd) $(E2EDrecordsetEdit) $(E2EDrecordsetIndFacet) $(E2EDrecordsetHistFacet)
RECORDADD_TESTS=$(E2EDIrecordAdd) $(E2EDIrecordMultiAdd) $(E2EDIrecordImmutable)
RECORDEDIT_TESTS=$(E2EDIrecordEdit) $(E2EDIrecordMultiEdit) $(E2EDrecordEditCompositeKey) $(E2EDrecordEditSubmissionDisabled) $(E2EDIrecordEditMultiColTypes) $(E2EDrecordEditDomainFilter)
PERMISSIONS_TESTS=$(E2EmultiPermissionsVisibility)
FOOTER_TESTS=$(E2Efooter)
ERRORS_TESTS=$(E2Eerrors)
DEFAULT_CONFIG_PARALLEL_TESTS=$(DefaultConfigParallel)
DELETE_PROHIBITED_PARALLEL_TESTS=$(DeleteProhibitedParallel)
FULL_FEATURES_CONFIRMATION_PARALLEL_TESTS=$(FullFeaturesConfirmationParallel)
FULL_FEATURES_PARALLEL_TESTS=$(FullFeaturesParallel)
PARALLEL_TESTS=$(FullFeaturesConfirmationParallel) $(DefaultConfigParallel) $(FullFeaturesParallel) $(DeleteProhibitedParallel)

ALL_TESTS=$(NAVBAR_TESTS) $(RECORD_TESTS) $(RECORDSET_TESTS) $(RECORDADD_TESTS) $(RECORDEDIT_TESTS) $(PERMISSIONS_TESTS) $(FOOTER_TESTS) $(ERRORS_TESTS)

ALL_MANUAL_TESTS=$(Manualrecordset)

define make_test
	rc=0; \
	for file in $(1); do \
		$(BIN)/protractor $$file || rc=1; \
	done; \
	exit $$rc;
endef

test-%:
	$(call make_test, $($*), "0")

#### Sequential make commands - these commands will run tests in sequential order
#Rule to run navbar tests
.PHONY: testnavbar
testnavbar: test-NAVBAR_TESTS

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

#Rule to run the default chaise configuration tests in parallel
.PHONY: testerrors
testerrors: test-ERRORS_TESTS

# Rule to setup schema and data for manual tests
.PHONY: testmanually
testmanually: test-ALL_MANUAL_TESTS

# Rule to run tests
.PHONY: test
test: test-ALL_TESTS

# ============================================================= #
#						BULDING THE PACKAGE						#
# ============================================================= #

# HTML files that need to be created
HTML=viewer/index.html \
	 recordedit/index.html \
	 record/index.html \
	 recordedit/mdHelp.html \
	 lib/switchUserAccounts.html \
	 $(DIST)/chaise-dependencies.html \
	 help/index.html

# the minified files that need to be created
MIN=$(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) \
	$(DIST)/$(SHARED_JS_SOURCE_MIN) \
	$(DIST)/$(RECORD_JS_SOURCE_MIN) \
	$(DIST)/$(RECORDEDIT_JS_SOURCE_MIN) \
	$(DIST)/$(VIEWER_JS_SOURCE_MIN) \
	$(DIST)/$(HELP_JS_SOURCE_MIN)

SOURCE=src

 DIST=dist

 # Shared utilities
 COMMON=common

 # old CSS source
 CSS=styles

 # old javascript sources
 JS=scripts

 MAKEFILE_VAR=makefile_variables.js
# -------------------------- shared/common files -------------------------- #

SHARED_JS_SOURCE=$(DIST)/$(MAKEFILE_VAR) \
	$(COMMON)/alerts.js \
	$(COMMON)/authen.js \
	$(COMMON)/bindHtmlUnsafe.js \
	$(COMMON)/config.js \
	$(COMMON)/delete-link.js \
	$(COMMON)/ellipsis.js \
	$(COMMON)/errors.js \
	$(COMMON)/export.js \
	$(COMMON)/faceting.js \
	$(COMMON)/filters.js \
	$(COMMON)/footer.js \
	$(COMMON)/inputs.js \
	$(COMMON)/login.js \
	$(COMMON)/modal.js \
	$(COMMON)/navbar.js \
	$(COMMON)/record.js \
	$(COMMON)/recordCreate.js \
	$(COMMON)/resizable.js \
	$(COMMON)/storage.js \
	$(COMMON)/table.js \
	$(COMMON)/upload.js \
	$(COMMON)/utils.js \
	$(COMMON)/validators.js

SHARED_JS_SOURCE_MIN=chaise.min.js
$(DIST)/$(SHARED_JS_SOURCE_MIN): $(SHARED_JS_SOURCE)
	$(call bundle_js_files,$(SHARED_JS_SOURCE_MIN),$(SHARED_JS_SOURCE))

ANGULARJS=$(JS)/vendor/angular.js

SHARED_JS_VENDOR_BASE=$(JS)/vendor/jquery-3.4.1.min.js \
	$(ANGULARJS) \
	$(JS)/vendor/bootstrap-3.3.7.min.js \
	$(JS)/vendor/plotly-latest.min.js

SHARED_JS_VENDOR_ASSET=$(JS)/vendor/angular-plotly.js \
	$(JS)/vendor/angular-messages.min.js \
	$(JS)/vendor/angular-sanitize.js \
	$(COMMON)/vendor/angular-cookies.min.js \
	$(COMMON)/vendor/angular-animate.min.js \
	$(COMMON)/vendor/angular-scroll.min.js \
	$(COMMON)/vendor/css-element-queries.js \
	$(JS)/vendor/ui-bootstrap-tpls-2.5.0.min.js

SHARED_JS_VENDOR_ASSET_MIN=chaise.vendor.min.js
$(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN): $(SHARED_JS_VENDOR_ASSET)
	$(call bundle_js_files,$(SHARED_JS_VENDOR_ASSET_MIN),$(SHARED_JS_VENDOR_ASSET))

SHARED_CSS_SOURCE=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/vendor/fontawesome.min.css \
	$(COMMON)/styles/app.css

SASS=$(COMMON)/styles/app.css
$(SASS): $(shell find $(COMMON)/styles/scss/)
	$(info - creating app.css and navbar.css)
	@$(BIN)/sass --style=compressed --embed-source-map --source-map-urls=relative $(COMMON)/styles/scss/app.scss $(COMMON)/styles/app.css
	@$(BIN)/sass --load-path=$(COMMON)/styles/scss/_variables.scss --style=compressed --embed-source-map --source-map-urls=relative $(COMMON)/styles/scss/_navbar.scss $(COMMON)/styles/navbar.css

JS_CONFIG=chaise-config.js
$(JS_CONFIG): chaise-config-sample.js
	cp -n chaise-config-sample.js $(JS_CONFIG) || true
	touch $(JS_CONFIG)

GOOGLE_DATASET_CONFIG=google-dataset-config.js

$(DIST)/$(MAKEFILE_VAR): $(BUILD_VERSION)
	$(info - creating makefile_variables.js)
	@echo 'var chaiseBuildVariables = {};' > $(DIST)/$(MAKEFILE_VAR)
	@echo 'chaiseBuildVariables.buildVersion="$(BUILD_VERSION)";' >> $(DIST)/$(MAKEFILE_VAR)
	@echo 'chaiseBuildVariables.chaiseBasePath="$(CHAISE_BASE_PATH)";' >> $(DIST)/$(MAKEFILE_VAR)
	@echo 'chaiseBuildVariables.ermrestjsBasePath="$(ERMRESTJS_BASE_PATH)";' >> $(DIST)/$(MAKEFILE_VAR)
	@echo 'chaiseBuildVariables.OSDViewerBasePath="$(OSD_VIEWER_BASE_PATH)";' >> $(DIST)/$(MAKEFILE_VAR)


$(DIST)/chaise-dependencies.html: $(BUILD_VERSION)
	$(info - creating chaise-dependencies.html)
	@> $(DIST)/chaise-dependencies.html
	@$(call add_css_link,$(DIST)/chaise-dependencies.html,)
	@$(call add_js_script,$(DIST)/chaise-dependencies.html,$(ANGULARJS) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(JS_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN))
	@$(call add_ermrestjs_script,$(DIST)/chaise-dependencies.html)

# list of file and folders that will be sent to the given location
RSYNC_FILE_LIST=common \
	dist \
	help \
	images \
	lib \
	record \
	recordedit \
	scripts \
	sitemap \
	styles \
	viewer \
	$(JS_CONFIG) \
	version.txt

.make-rsync-list:
	$(info - creating .make-rsync-list)
	@> .make-rsync-list
	@$(call add_array_to_file,$(RSYNC_FILE_LIST),.make-rsync-list)

# -------------------------- record app -------------------------- #
RECORD_ROOT=record

RECORD_JS_SOURCE=$(RECORD_ROOT)/record.app.js \
	$(RECORD_ROOT)/record.utils.js \
	$(RECORD_ROOT)/record.controller.js

RECORD_JS_SOURCE_MIN=record.min.js
$(DIST)/$(RECORD_JS_SOURCE_MIN): $(RECORD_JS_SOURCE)
	$(call bundle_js_files,$(RECORD_JS_SOURCE_MIN),$(RECORD_JS_SOURCE))

RECORD_JS_VENDOR_ASSET=

RECORD_CSS_SOURCE=

.make-record-includes: $(BUILD_VERSION)
	$(info - creating .make-record-includes)
	@> .make-record-includes
	@$(call add_css_link,.make-record-includes,$(RECORD_CSS_SOURCE))
	@$(call add_js_script, .make-record-includes,$(SHARED_JS_VENDOR_BASE) $(RECORD_JS_VENDOR_ASSET) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(JS_CONFIG) $(GOOGLE_DATASET_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN) $(DIST)/$(RECORD_JS_SOURCE_MIN))
	@$(call add_ermrestjs_script,.make-record-includes)

record/index.html: record/index.html.in .make-record-includes
	$(info - creating record/index.html)
	@$(call build_html, .make-record-includes, record/index.html)


# -------------------------- recordedit app -------------------------- #
RECORDEDIT_ROOT=recordedit

RECORDEDIT_JS_SOURCE=$(RECORDEDIT_ROOT)/recordEdit.app.js \
	$(RECORDEDIT_ROOT)/model.js \
	$(RECORDEDIT_ROOT)/form.controller.js \
	$(RECORDEDIT_ROOT)/recordedit.utils.js

RECORDEDIT_JS_SOURCE_MIN=recordedit.min.js
$(DIST)/$(RECORDEDIT_JS_SOURCE_MIN): $(RECORDEDIT_JS_SOURCE)
	$(call bundle_js_files,$(RECORDEDIT_JS_SOURCE_MIN),$(RECORDEDIT_JS_SOURCE))

# TODO why four different files for markdown? if inputswitch will be used everywhere, this should move to shared
RECORDEDIT_JS_VENDOR_ASSET=$(COMMON)/vendor/MarkdownEditor/bootstrap-markdown.js \
	$(COMMON)/vendor/MarkdownEditor/highlight.min.js \
	$(COMMON)/vendor/MarkdownEditor/angular-highlightjs.min.js \
	$(COMMON)/vendor/MarkdownEditor/angular-markdown-editor.js \
	$(COMMON)/vendor/mask.min.js \
	$(COMMON)/vendor/spectrum/spectrum.min.js

RECORDEDIT_CSS_SOURCE=$(COMMON)/vendor/MarkdownEditor/styles/bootstrap-markdown.min.css \
	$(COMMON)/vendor/MarkdownEditor/styles/github.min.css \
	$(COMMON)/vendor/MarkdownEditor/styles/angular-markdown-editor.min.css \
	$(COMMON)/vendor/spectrum/spectrum.min.css

.make-recordedit-includes: $(BUILD_VERSION)
	@> .make-recordedit-includes
	$(info - creating .make-recordedit-includes)
	@$(call add_css_link,.make-recordedit-includes,$(RECORDEDIT_CSS_SOURCE))
	@$(call add_js_script,.make-recordedit-includes,$(SHARED_JS_VENDOR_BASE) $(RECORDEDIT_JS_VENDOR_ASSET) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(JS_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN) $(DIST)/$(RECORDEDIT_JS_SOURCE_MIN))
	@$(call add_ermrestjs_script,.make-recordedit-includes)

recordedit/index.html: recordedit/index.html.in .make-recordedit-includes
	$(info - creating recordedit/index.html)
	@$(call build_html,.make-recordedit-includes,recordedit/index.html)

# -------------------------- markdown help app -------------------------- #
MDHELP_JS_SOURCE=$(RECORDEDIT_ROOT)/mdHelp.app.js

MDHELP_CSS_SOURCE=$(RECORDEDIT_ROOT)/mdHelpStyle.min.css

.make-mdhelp-includes: $(BUILD_VERSION)
	@> .make-mdhelp-includes
	$(info - creating .make-mdhelp-includes)
	@$(call add_css_link,.make-mdhelp-includes,$(MDHELP_CSS_SOURCE))
	@$(call add_js_script,.make-mdhelp-includes,$(SHARED_JS_VENDOR_BASE) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(JS_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN) $(MDHELP_JS_SOURCE))
	@$(call add_ermrestjs_script,.make-mdhelp-includes)

recordedit/mdHelp.html: recordedit/mdHelp.html.in .make-mdhelp-includes
	$(info - creating recordedit/mdHelp.html)
	@$(call build_html, .make-mdhelp-includes, recordedit/mdHelp.html)

# -------------------------- viewer app -------------------------- #
VIEWER_ROOT=viewer

VIEWER_CONFIG=$(VIEWER_ROOT)/viewer-config.js
$(VIEWER_CONFIG): $(VIEWER_ROOT)/viewer-config-sample.js
	cp -n $(VIEWER_ROOT)/viewer-config-sample.js $(VIEWER_CONFIG) || true
	touch $(VIEWER_CONFIG)

VIEWER_JS_SOURCE=$(VIEWER_ROOT)/viewer.app.js \
	$(VIEWER_ROOT)/viewer.controller.js \
	$(VIEWER_ROOT)/viewer.utils.js \
	$(VIEWER_ROOT)/context.js \
	$(VIEWER_ROOT)/annotations/annotations.js \
	$(VIEWER_ROOT)/annotations/annotations.service.js \
	$(VIEWER_ROOT)/annotations/annotations.controller.js

VIEWER_JS_SOURCE_MIN=viewer.min.js
$(DIST)/$(VIEWER_JS_SOURCE_MIN): $(VIEWER_JS_SOURCE)
	$(call bundle_js_files,$(VIEWER_JS_SOURCE_MIN),$(VIEWER_JS_SOURCE))

VIEWER_JS_VENDOR_ASSET=$(COMMON)/vendor/re-tree.js \
	$(COMMON)/vendor/MarkdownEditor/bootstrap-markdown.js \
	$(COMMON)/vendor/MarkdownEditor/highlight.min.js \
	$(COMMON)/vendor/MarkdownEditor/angular-highlightjs.min.js \
	$(COMMON)/vendor/MarkdownEditor/angular-markdown-editor.js \
	$(COMMON)/vendor/mask.min.js \
	$(COMMON)/vendor/spectrum/spectrum.min.js

VIEWER_CSS_SOURCE=$(COMMON)/vendor/MarkdownEditor/styles/bootstrap-markdown.min.css \
	$(COMMON)/vendor/MarkdownEditor/styles/github.min.css \
	$(COMMON)/vendor/MarkdownEditor/styles/angular-markdown-editor.min.css \
	$(COMMON)/vendor/spectrum/spectrum.min.css

.make-viewer-includes: $(BUILD_VERSION)
	@> .make-viewer-includes
	$(info - creating .make-viewer-includes)
	@$(call add_css_link, .make-viewer-includes,$(VIEWER_CSS_SOURCE))
	@$(call add_js_script, .make-viewer-includes, $(SHARED_JS_VENDOR_BASE) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(JS_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN) $(VIEWER_JS_VENDOR_ASSET) $(VIEWER_CONFIG) $(DIST)/$(VIEWER_JS_SOURCE_MIN))
	@$(call add_ermrestjs_script,.make-viewer-includes)

viewer/index.html: viewer/index.html.in .make-viewer-includes
	$(info - creating viewer/index.html)
	@$(call build_html, .make-viewer-includes, viewer/index.html)

# -------------------------- switch user help app -------------------------- #
SWITCH_USER_JS_SOURCE=lib/switchUserAccounts.app.js

.make-switchuser-includes: $(BUILD_VERSION)
	@> .make-switchuser-includes
	$(info - creating .make-switchuser-includes)
	@$(call add_css_link,.make-switchuser-includes,)
	@$(call add_js_script,.make-switchuser-includes,$(SHARED_JS_VENDOR_BASE) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(JS_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN)  $(SWITCH_USER_JS_SOURCE))
	@$(call add_ermrestjs_script,.make-switchuser-includes)

lib/switchUserAccounts.html: lib/switchUserAccounts.html.in .make-switchuser-includes
	$(info - creating lib/switchUserAccounts.html)
	@$(call build_html,.make-switchuser-includes,lib/switchUserAccounts.html)

# -------------------------- help app -------------------------- #
HELP_JS_SOURCE=help/help.app.js

HELP_JS_SOURCE_MIN=help.min.js
$(DIST)/$(HELP_JS_SOURCE_MIN): $(HELP_JS_SOURCE)
	$(call bundle_js_files,$(HELP_JS_SOURCE_MIN),$(HELP_JS_SOURCE))

HELP_CSS_SOURCE=

HELP_VENDOR_ASSET=

.make-help-includes: $(BUILD_VERSION)
	@> .make-help-includes
	$(info - creating .make-help-includes)
	@$(call add_css_link,.make-help-includes,$(HELP_CSS_SOURCE))
	@$(call add_js_script,.make-help-includes,$(SHARED_JS_VENDOR_BASE) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(HELP)/$(HELP_VENDOR_ASSET) $(JS_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN) $(DIST)/$(HELP_JS_SOURCE_MIN))
	@$(call add_ermrestjs_script,.make-help-includes)

help/index.html: help/index.html.in .make-help-includes
	$(info - creating help/index.html)
	@$(call build_html,.make-help-includes,help/index.html)


# -------------------------- utility functions -------------------------- #

# given a list of css files, will create link tag for each one and appends to the first parameter location
define add_css_link
	for file in $(SHARED_CSS_SOURCE) $(2); do \
		runtimepath=$(CHAISE_BASE_PATH)$$file; \
		version=$(BUILD_VERSION); \
		echo "<link rel='stylesheet' type='text/css' href='$$runtimepath?v=$$version'>" >> $(1) ; \
	done
endef

# given a list of js files, will create script tag for each one and appends to the first parameter location
define add_js_script
	for file in $(2); do \
		runtimepath=$(CHAISE_BASE_PATH)$$file; \
		version=$(BUILD_VERSION); \
		echo "<script src='$$runtimepath?v=$$version'></script>" >> $(1) ; \
	done
endef

# will create script tag for ermrestjs dep and appends to the parameter location
define add_ermrestjs_script
	for file in $(ERMRESTJS_DEPS); do \
		runtimepath=$(ERMRESTJS_BASE_PATH)$$file ; \
		version=$(BUILD_VERSION); \
		echo "<script src='$$runtimepath?v=$$version'></script>" >> $(1) ; \
	done
endef

# add meta and assets to the html
define build_html
    sed -e '/%INCLUDES%/ {' -e 'r $(1)' -e 'd' -e '}' \
        $(2).in common/templates/noscript.html > $(2)
endef

# given a list of js files, create a minified version
define bundle_js_files
	$(info - creating $(1))
	@$(BIN)/uglifyjs $(2) -o $(DIST)/$(1) --compress --source-map "url='$(1).map',root='$(CHAISE_BASE_PATH)'"
endef

define add_array_to_file
	for folder in $(1); do \
		echo "$$folder" >> $(2); \
	done
endef

# build version will change everytime it's called
$(BUILD_VERSION):

# make sure the latest webdriver is installed
.PHONY: update-webdriver
update-webdriver:
	node_modules/protractor/bin/webdriver-manager update --versions.standalone 3.6.0

# install packages (honors NOD_ENV)
# using clean-install instead of install to ensure usage of pacakge-lock.json
.PHONY: npm-install-modules
npm-install-modules:
	@npm clean-install

# install packages needed for production and development (including testing)
# --production=false makes sure to ignore NODE_ENV and install everything
.PHONY: npm-install-all-modules
npm-install-all-modules:
	@npm clean-install --production=false

# for test cases we have to make sure we're installing dev dependencies and
# webdriver is always updated to the latest version
.PHONY: test-deps
deps-test: npm-install-all-modules update-webdriver

# install all the dependencies
.PHONY: deps
deps: npm-install-modules

.PHONY: updeps
updeps:
	npm update

# Rule to clean project directory
.PHONY: clean
clean:
	@rm $(HTML) || true
	@rm $(COMMON)/styles/app.css || true
	@rm $(COMMON)/styles/navbar.css || true
	@rm -rf $(DIST) || true
	@rm .make-* || true

# Rule to clean the dependencies too
.PHONY: distclean
distclean: clean
	rm -rf $(MODULES) || true

.PHONY: lint
lint: $(SOURCE)
	@npx eslint src --ext .ts,.tsx --quiet

.PHONY: lint-w-warn
lint-w-warn: $(SOURCE)
	@npx eslint src --ext .ts,.tsx

# Rule to create the package.
.PHONY: dist-wo-deps
dist-wo-deps: print-variables run-webpack $(SASS) $(MIN) $(HTML) gitversion

# Rule to install the dependencies and create the pacakge
$(DIST): deps dist-wo-deps

run-webpack: $(SOURCE) $(BUILD_VERSION)
	$(info - creating webpack bundles)
	@npx webpack --config ./webpack/main.config.js --env BUILD_VARIABLES.BUILD_VERSION=$(BUILD_VERSION) --env BUILD_VARIABLES.CHAISE_BASE_PATH=$(CHAISE_BASE_PATH) --env BUILD_VARIABLES.ERMRESTJS_BASE_PATH=$(ERMRESTJS_BASE_PATH) --env BUILD_VARIABLES.OSD_VIEWER_BASE_PATH=$(OSD_VIEWER_BASE_PATH)

# deploy chaise to the location
.PHONY: deploy
deploy: dont_deploy_in_root .make-rsync-list
	$(info - deploying the package)
	@rsync -ravz --files-from=.make-rsync-list --exclude='dist/react' --exclude='$(JS_CONFIG)' --exclude='$(VIEWER_CONFIG)' . $(CHAISEDIR)
	@rsync -avz $(DIST)/react/ $(CHAISEDIR)

# rsync the build and config files to the location
.PHONY: deploy-w-config
deploy-w-config: dont_deploy_in_root .make-rsync-list $(JS_CONFIG) $(VIEWER_CONFIG)
	$(info - deploying the package with the existing default config files)
	@rsync -ravz --files-from=.make-rsync-list --exclude='dist/react' . $(CHAISEDIR)
	@rsync -avz $(DIST)/react/ $(CHAISEDIR)

# Rule to create version.txt
.PHONY: gitversion
gitversion:
	$(info - creating version.txt)
	@> version.txt
	@sh ./git_version_info.sh

dont_deploy_in_root:
	@echo "$(CHAISEDIR)" | egrep -vq "^/$$|.*:/$$"

print-variables:
	@mkdir -p $(DIST)
	$(info =================)
	$(info NODE_ENV:=$(NODE_ENV))
	$(info BUILD_VERSION=$(BUILD_VERSION))
	$(info building and deploying to: $(CHAISEDIR))
	$(info Chaise will be accessed using: $(CHAISE_BASE_PATH))
	$(info ERMrestJS must already be deployed and accesible using: $(ERMRESTJS_BASE_PATH))
	$(info If using viewer, OSD viewer must already be deployed and accesible using: $(OSD_VIEWER_BASE_PATH))
	$(info =================)

# Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Usage: make [target]"
	@echo "Available targets:"
	@echo "  dist                           local install of node dependencies, build the chaise bundles"
	@echo "  dist-wo-deps                   build the chaise bundles"
	@echo "  deploy                         deploy chaise to the given location"
	@echo "  deploy-w-config                deploy chaise to the given location with config files"
	@echo "  clean                          remove the files and folders created during build"
	@echo "  distclean                      the same as clean, and also removes npm dependencies"
	@echo "  deps                           local install of node dependencies"
	@echo "  updeps                         local update  of node dependencies"
	@echo "  update-webdriver               update the protractor's webdriver"
	@echo "  deps-test                      local install of dev node dependencies and update protractor's webdriver"
	@echo "  test                           run e2e tests"
	@echo "  testrecordadd                  run data entry app add e2e tests"
	@echo "  testrecordedit                 run data entry app edit e2e tests"
	@echo "  testrecord                     run record app e2e tests"
	@echo "  testrecordset                  run recordset app e2e tests"
	@echo "  testviewer                     run viewer app e2e tests"
	@echo "  testnavbar                     run navbar e2e tests"
