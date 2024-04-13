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

# ============================================================= #
#						E2E TESTING RULES						#
# ============================================================= #

### test scripts
## Sequential test scripts
# Recordedit tests
E2EDIrecordAdd=test/e2e/specs/all-features-confirmation/recordedit/add.conf.js
E2EDIrecordEditMultiColTypes=test/e2e/specs/default-config/recordedit/multi-col-types.conf.js
E2EDIrecordImmutable=test/e2e/specs/default-config/recordedit/immutable-inputs.conf.js
E2EDIrecordEdit=test/e2e/specs/all-features-confirmation/recordedit/edit-delete.conf.js
# not part of the make recordedit command anymore
E2EDIrecordMultiFormInput=test/e2e/specs/default-config/multi-form-input/multi-form-input.config.ts
E2EDIrecordMultiEdit=test/e2e/specs/default-config/recordedit/multi-edit.conf.js
E2EDrecordEditCompositeKey=test/e2e/specs/default-config/recordedit/composite-key.conf.js
E2EDrecordEditDomainFilter=test/e2e/specs/default-config/recordedit/domain-filter.conf.js
E2EDrecordEditSubmissionDisabled=test/e2e/specs/default-config/recordedit/submission-disabled.conf.js
E2ErecordEditForeignKeyDropdown=test/e2e/specs/default-config/recordedit/foreign-key-dropdown.conf.js
E2ErecordEditInputIframe=test/e2e/specs/all-features/recordedit/input-iframe.conf.js
# Record tests
E2EDrecord=test/e2e/specs/all-features-confirmation/record/presentation-btn.conf.js
E2EDrecordCopy=test/e2e/specs/all-features/record/copy-btn.conf.js
E2ErecordNoDeleteBtn=test/e2e/specs/delete-prohibited/record/no-delete-btn.config.ts
E2EDrecordRelatedTable=test/e2e/specs/all-features/record/related-table.conf.js
E2EDrecordLinks=test/e2e/specs/default-config/record/links.conf.js
# Recordset tests
E2EDrecordset=test/e2e/specs/all-features-confirmation/recordset/presentation.conf.js
E2EDrecordsetEdit=test/e2e/specs/default-config/recordset/edit.conf.js
E2ErecordsetAdd=test/e2e/specs/default-config/recordset/add.conf.js
E2EDrecordsetIndFacet=test/e2e/specs/delete-prohibited/recordset/ind-facet.conf.js
E2EDrecordsetHistFacet=test/e2e/specs/delete-prohibited/recordset/histogram-facet.conf.js
E2ErecordsetSavedQuery=test/e2e/specs/all-features/recordset/saved-query.conf.js

# misc tests
E2Enavbar=test/e2e/specs/all-features/navbar/playwright.config.ts
E2EnavbarHeadTitle=test/e2e/specs/all-features-confirmation/navbar/playwright.config.ts
E2EnavbarCatalogConfig=test/e2e/specs/delete-prohibited/navbar/playwright.config.ts
E2EmultiPermissionsVisibility=test/e2e/specs/all-features/permissions.conf.js
# footer test
E2Efooter=test/e2e/specs/all-features-confirmation/footer/playwright.config.ts
# errors test
E2Eerrors=test/e2e/specs/all-features-confirmation/errors/protractor.conf.js
## Parallel test scripts (protractor)
AllFeaturesParallel_PROTRACTOR=test/e2e/specs/all-features/protractor.conf.js
AllFeaturesConfirmationParallel_PROTRACTOR=test/e2e/specs/all-features-confirmation/protractor.conf.js
DeleteProhibitedParallel_PROTRACTOR=test/e2e/specs/delete-prohibited/protractor.conf.js
DefaultConfigParallel_PROTRACTOR=test/e2e/specs/default-config/protractor.conf.js
## Parallel test scripts
AllFeaturesParallel=test/e2e/specs/all-features/playwright.config.ts
AllFeaturesConfirmationParallel=test/e2e/specs/all-features-confirmation/playwright.config.ts
DeleteProhibitedParallel=test/e2e/specs/delete-prohibited/playwright.config.ts
DefaultConfigParallel=test/e2e/specs/default-config/playwright.config.ts
# Setup for manual tests
Manualrecordset=test/manual/specs/recordset.conf.js

# protractor tests
RECORD_TESTS_PROTRACTOR=$(E2EDrecord) $(E2EDrecordCopy) $(E2EDrecordLinks)
RECORDSET_TESTS_PROTRACTOR=$(E2EDrecordset) $(E2ErecordsetAdd) $(E2EDrecordsetEdit) $(E2EDrecordsetIndFacet) $(E2EDrecordsetHistFacet) $(E2ErecordsetSavedQuery)
RECORDADD_TESTS_PROTRACTOR=$(E2EDIrecordAdd) $(E2EDIrecordMultiFormInput) $(E2EDIrecordImmutable) $(E2ErecordEditForeignKeyDropdown)
RECORDEDIT_TESTS_PROTRACTOR=$(E2EDIrecordEdit) $(E2EDIrecordMultiEdit) $(E2EDrecordEditCompositeKey) $(E2EDrecordEditSubmissionDisabled) $(E2EDIrecordEditMultiColTypes) $(E2EDrecordEditDomainFilter) $(E2ErecordEditInputIframe)
PERMISSIONS_TESTS_PROTRACTOR=$(E2EmultiPermissionsVisibility)
ERRORS_TESTS_PROTRACTOR=$(E2Eerrors)
DEFAULT_CONFIG_PARALLEL_TESTS_PROTRACTOR=$(DefaultConfigParallel_PROTRACTOR)
DELETE_PROHIBITED_PARALLEL_TESTS_PROTRACTOR=$(DeleteProhibitedParallel_PROTRACTOR)
ALL_FEATURES_CONFIRMATION_PARALLEL_TESTS_PROTRACTOR=$(AllFeaturesConfirmationParallel_PROTRACTOR)
ALL_FEATURES_PARALLEL_TESTS_PROTRACTOR=$(AllFeaturesParallel_PROTRACTOR)
PARALLEL_TESTS_PROTRACTOR=$(AllFeaturesConfirmationParallel_PROTRACTOR) $(DefaultConfigParallel_PROTRACTOR) $(AllFeaturesParallel_PROTRACTOR) $(DeleteProhibitedParallel_PROTRACTOR)
ALL_TESTS_PROTRACTOR=$(RECORD_TESTS_PROTRACTOR) $(RECORDSET_TESTS_PROTRACTOR) $(RECORDADD_TESTS_PROTRACTOR) $(RECORDEDIT_TESTS_PROTRACTOR) $(PERMISSIONS_TESTS_PROTRACTOR) $(FOOTER_TESTS_PROTRACTOR) $(ERRORS_TESTS_PROTRACTOR)

# playwright tests
NAVBAR_TESTS=$(E2Enavbar) $(E2EnavbarHeadTitle) $(E2EnavbarCatalogConfig)
RECORD_TESTS=$(E2ErecordNoDeleteBtn) $(E2EDrecordRelatedTable)
RECORDSET_TESTS=
RECORDADD_TESTS=$(E2EDIrecordMultiFormInput)
RECORDEDIT_TESTS=
PERMISSIONS_TESTS=
FOOTER_TESTS=$(E2Efooter)
ERRORS_TESTS=
DEFAULT_CONFIG_PARALLEL_TESTS=$(DefaultConfigParallel)
DELETE_PROHIBITED_PARALLEL_TESTS=$(DeleteProhibitedParallel)
ALL_FEATURES_CONFIRMATION_PARALLEL_TESTS=$(AllFeaturesConfirmationParallel)
ALL_FEATURES_PARALLEL_TESTS=$(AllFeaturesParallel)
PARALLEL_TESTS=$(AllFeaturesConfirmationParallel) $(DefaultConfigParallel) $(AllFeaturesParallel) $(DeleteProhibitedParallel)
ALL_TESTS=$(NAVBAR_TESTS) $(RECORD_TESTS) $(RECORDSET_TESTS) $(RECORDADD_TESTS) $(RECORDEDIT_TESTS) $(PERMISSIONS_TESTS) $(FOOTER_TESTS) $(ERRORS_TESTS)

ALL_MANUAL_TESTS=$(Manualrecordset)

define make_test_protractor
	rc=0; \
	for file in $(1); do \
		npx protractor $$file || rc=1; \
	done; \
	exit $$rc;
endef

define make_test
	rc=0; \
	for file in $(1); do \
		 npx playwright test --project=chrome --config $$file || rc=1; \
	done; \
	exit $$rc;
endef

test_protractor-%:
	$(call make_test_protractor, $($*), "0")

test-%:
	$(call make_test, $($*), "0")

#### Sequential make commands - these commands will run tests in sequential order
#Rule to run navbar tests
.PHONY: testnavbar
testnavbar: test-NAVBAR_TESTS

.PHONY: testrecord-protractor
testrecord-protractor: test_protractor-RECORD_TESTS_PROTRACTOR

#Rule to run record tests
.PHONY: testrecord
testrecord: test-RECORD_TESTS

.PHONY: testrecord-protractor
testrecord-protractor: test-RECORD_TESTS_PROTRACTOR

#Rule to run record add app tests
.PHONY: testrecordadd
testrecordadd: test-RECORDADD_TESTS

.PHONY: testrecordadd-protractor
testrecordadd-protractor: test_protractor-RECORDADD_TESTS_PROTRACTOR

# Rule to run record edit app tests
.PHONY: testrecordedit
testrecordedit: test-RECORDEDIT_TESTS

.PHONY: testrecordedit-protractor
testrecordedit-protractor: test_protractor-RECORDEDIT_TESTS_PROTRACTOR

# Rule to run permission tests
.PHONY: testpermissions
testpermissions:test-PERMISSIONS_TESTS

.PHONY: testpermissions-protractor
testpermissions-protractor:test_protractor-PERMISSIONS_TESTS_PROTRACTOR

#Rule to run recordset app tests
.PHONY: testrecordset
testrecordset: test-RECORDSET_TESTS

.PHONY: testrecordset-protractor
testrecordset-protractor: test_protractor-RECORDSET_TESTS_PROTRACTOR

#### Parallel make commands - these commands will run tests in parallel
#Rule to run all parallel test configurations
.PHONY: testparallel
testparallel: test-PARALLEL_TESTS

.PHONY: testparallel-protractor
testparallel-protractor: test_protractor-PARALLEL_TESTS_PROTRACTOR

#Rule to run the All features chaise configuration tests in parallel
.PHONY: testallfeatures
testallfeatures: test-ALL_FEATURES_PARALLEL_TESTS

.PHONY: testallfeatures-protractor
testallfeatures-protractor: test_protractor-ALL_FEATURES_PARALLEL_TESTS_PROTRACTOR

#Rule to run the All features chaise configuration tests in parallel
.PHONY: testallfeaturesconfirmation
testallfeaturesconfirmation: test-ALL_FEATURES_CONFIRMATION_PARALLEL_TESTS

.PHONY: testallfeaturesconfirmation-protractor
testallfeaturesconfirmation-protractor: test_protractor-ALL_FEATURES_CONFIRMATION_PARALLEL_TESTS_PROTRACTOR

#Rule to run the delete prohibited chaise configuration tests in parallel
.PHONY: testdeleteprohibited
testdeleteprohibited: test-DELETE_PROHIBITED_PARALLEL_TESTS

.PHONY: testdeleteprohibited-protractor
testdeleteprohibited-protractor: test_protractor-DELETE_PROHIBITED_PARALLEL_TESTS_PROTRACTOR


#Rule to run the default chaise configuration tests in parallel
.PHONY: testdefaultconfig
testdefaultconfig: test-DEFAULT_CONFIG_PARALLEL_TESTS

.PHONY: testdefaultconfig-protractor
testdefaultconfig-protractor: test_protractor-DEFAULT_CONFIG_PARALLEL_TESTS_PROTRACTOR

#Rule to run the default chaise configuration tests in parallel
.PHONY: testfooter
testfooter: test-FOOTER_TESTS

.PHONY: testfooter-protractor
testfooter-protractor: test_protractor-FOOTER_TESTS_PROTRACTOR

#Rule to run the default chaise configuration tests in parallel
.PHONY: testerrors
testerrors: test-ERRORS_TESTS

.PHONY: testerrors-protractor
testerrors-protractor: test_protractor-ERRORS_TESTS_PROTRACTOR

# Rule to setup schema and data for manual tests
.PHONY: testmanually
testmanually: test_protractor-ALL_MANUAL_TESTS

# Rule to run tests
.PHONY: test
test: test-ALL_TESTS

.PHONY: test-protractor
test-protractor: test_protractor-ALL_TESTS_PROTRACTOR

# ============================================================= #
#						BULDING THE PACKAGE						#
# ============================================================= #

# HTML files that need to be created
HTML=$(DIST)/chaise-dependencies.html

# the minified files that need to be created
MIN=$(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) \
	$(DIST)/$(SHARED_JS_SOURCE_MIN)

SOURCE=src

DIST=dist

# where config files are defined
CONFIG=config

# Shared utilities
COMMON=common

# old CSS source
CSS=styles

# old javascript sources
JS=scripts

 MAKEFILE_VAR=makefile_variables.js

# react bundle location
REACT_BUNDLES_FOLDERNAME=bundles
REACT_BUNDLES=$(DIST)/react/$(REACT_BUNDLES_FOLDERNAME)

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
	@npx sass --style=compressed --embed-source-map --source-map-urls=relative $(COMMON)/styles/scss/app.scss $(COMMON)/styles/app.css
	@npx sass --load-path=$(COMMON)/styles/scss/_variables.scss --style=compressed --embed-source-map --source-map-urls=relative $(COMMON)/styles/scss/_navbar.scss $(COMMON)/styles/navbar.css

# should eventually be removed
DEPRECATED_JS_CONFIG=chaise-config.js

JS_CONFIG=$(CONFIG)/chaise-config.js
$(JS_CONFIG): $(CONFIG)/chaise-config-sample.js
	cp -n $(CONFIG)/chaise-config-sample.js $(JS_CONFIG) || true
	touch $(JS_CONFIG)

VIEWER_CONFIG=$(CONFIG)/viewer-config.js
$(VIEWER_CONFIG): $(CONFIG)/viewer-config-sample.js
	cp -n $(CONFIG)/viewer-config-sample.js $(VIEWER_CONFIG) || true
	touch $(VIEWER_CONFIG)

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
	@$(call add_js_script,$(DIST)/chaise-dependencies.html,$(ANGULARJS) $(DIST)/$(SHARED_JS_VENDOR_ASSET_MIN) $(DEPRECATED_JS_CONFIG) $(JS_CONFIG) $(DIST)/$(SHARED_JS_SOURCE_MIN))
	@$(call add_ermrestjs_script,$(DIST)/chaise-dependencies.html)

# list of file and folders that will be sent to the given location
RSYNC_FILE_LIST=common \
	dist \
	help-docs \
	images \
	lib \
	scripts \
	sitemap \
	styles \
	$(JS_CONFIG_SAMPLE) \
	$(VIEWER_CONFIG_SAMPLE) \
	version.txt

# the same list above but also includes the config files
RSYNC_FILE_LIST_W_CONFIG=$(RSYNC_FILE_LIST) \
	$(JS_CONFIG) \
	$(VIEWER_CONFIG)

# build_version dep forces this file to regenerate in case the file list changed
.make-rsync-list: $(BUILD_VERSION)
	$(info - creating .make-rsync-list)
	@> .make-rsync-list
	@$(call add_array_to_file,$(RSYNC_FILE_LIST),.make-rsync-list)

# build_version dep forces this file to regenerate in case the file list changed
.make-rsync-list-w-config: $(BUILD_VERSION)
	$(info - creating .make-rsync-list-w-config)
	@> .make-rsync-list-w-config
	@$(call add_array_to_file,$(RSYNC_FILE_LIST_W_CONFIG),.make-rsync-list-w-config)

# vendor files that will be treated externally in webpack
WEBPACK_EXTERNAL_VENDOR_FILES= \
	$(MODULES)/plotly.js-basic-dist-min/plotly-basic.min.js

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
	@npx uglifyjs $(2) -o $(DIST)/$(1) --compress --source-map "url='$(1).map',root='$(CHAISE_BASE_PATH)'"
endef

define add_array_to_file
	for folder in $(1); do \
		echo "$$folder" >> $(2); \
	done
endef

define copy_webpack_external_vendor_files
	$(info - copying webpack external files into location)
	mkdir -p $(REACT_BUNDLES)
	for f in $(WEBPACK_EXTERNAL_VENDOR_FILES); do \
		eval "rsync -a $$f $(REACT_BUNDLES)" ; \
	done
endef

# build version will change everytime it's called
$(BUILD_VERSION):

# make sure the latest webdriver is installed
# - we fixed the version since this is the latest version that works with
#   the protractor version that we're using.
# - we're only using chrome, so we're ignoring gecko installation.
.PHONY: update-webdriver
update-webdriver:
	node_modules/protractor/bin/webdriver-manager update --versions.standalone 3.6.0 --gecko false

# install packages (honors NOD_ENV)
# using clean-install instead of install to ensure usage of pacakge-lock.json
.PHONY: npm-install-modules
npm-install-modules:
	@npm clean-install

# install packages needed for production and development (including testing)
# also run patch-package to patch all the issues in dependencies (currently only webdriver-manager.)
# if we decided to patch other prod dependencies, we should move `patch-package` command to the `postinstall` of package.json.
# --include=dev makes sure to ignore NODE_ENV and install everything
.PHONY: npm-install-all-modules
npm-install-all-modules:
	@npm clean-install --include=dev
	@npx patch-package
	@npx playwright install --with-deps

# for test cases we have to make sure we're installing dev dependencies and
# webdriver is always updated to the latest version
.PHONY: deps-test
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
	@rm -rf $(MODULES) || true

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

# run webpack to build the react folder and bundles in it, and
# copy the external vendor files that webpack expects into react folder
run-webpack: $(SOURCE) $(BUILD_VERSION)
	$(info - creating webpack bundles)
	@npx webpack --config ./webpack/main.config.js --env BUILD_VARIABLES.BUILD_VERSION=$(BUILD_VERSION) --env BUILD_VARIABLES.CHAISE_BASE_PATH=$(CHAISE_BASE_PATH) --env BUILD_VARIABLES.ERMRESTJS_BASE_PATH=$(ERMRESTJS_BASE_PATH) --env BUILD_VARIABLES.OSD_VIEWER_BASE_PATH=$(OSD_VIEWER_BASE_PATH)
	@$(call copy_webpack_external_vendor_files)

# deploy chaise to the location
# this is separated into three seaprate rsyncs:
#  - send AngularJS files
#  - send React related files except bundles folder
#  - send bundles folder. This is separated to ensure cleaning up the bundles folder
#    The content of bundles folder are generated based on hash so we have to make sure older files are deleted.
.PHONY: deploy
deploy: dont_deploy_in_root .make-rsync-list
	$(info - deploying the package)
	@rsync -ravz --files-from=.make-rsync-list --exclude='$(DIST)/react' . $(CHAISEDIR)
	@rsync -avz --exclude='$(REACT_BUNDLES_FOLDERNAME)' $(DIST)/react/ $(CHAISEDIR)
	@rsync -avz --delete $(REACT_BUNDLES) $(CHAISEDIR)

# rsync the build and config files to the location
# refer to the previous comment for why this is separated into three different rsyncs
.PHONY: deploy-w-config
deploy-w-config: dont_deploy_in_root .make-rsync-list-w-config $(JS_CONFIG) $(VIEWER_CONFIG)
	$(info - deploying the package with the existing default config files)
	@rsync -ravz --files-from=.make-rsync-list-w-config --exclude='$(DIST)/react' . $(CHAISEDIR)
	@rsync -avz --exclude='$(REACT_BUNDLES_FOLDERNAME)' $(DIST)/react/ $(CHAISEDIR)
	@rsync -avz --delete $(REACT_BUNDLES) $(CHAISEDIR)

# run dist and deploy with proper uesrs (GNU). only works with root user
.PHONY: root-install
root-install:
	su $(shell stat -c "%U" Makefile) -c "make dist"
	make deploy

# run dist and deploy with proper uesrs (FreeBSD and MAC OS X). only works with root user
.PHONY: root-install-alt
root-install-alt:
	su $(shell stat -f '%Su' Makefile) -c "make dist"
	make deploy

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
	@echo "  root-install                   should only be used as root. will use dist with proper user and then deploy, for GNU systems"
	@echo "  root-install-alt               should only be used as root. will use dist with proper user and then deploy, for FreeBSD and MAC OS X"
	@echo "  test                           run e2e tests"
	@echo "  testrecordadd                  run data entry app add e2e tests"
	@echo "  testrecordedit                 run data entry app edit e2e tests"
	@echo "  testrecord                     run record app e2e tests"
	@echo "  testrecordset                  run recordset app e2e tests"
	@echo "  testviewer                     run viewer app e2e tests"
	@echo "  testnavbar                     run navbar e2e tests"
