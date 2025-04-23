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
E2EDIrecordAdd=test/e2e/specs/all-features-confirmation/recordedit/add.config.ts
E2EDrecordEditNullValues=test/e2e/specs/default-config/recordedit/null-values.config.ts
E2EDIrecordImmutable=test/e2e/specs/default-config/recordedit/immutable-inputs.config.ts
E2EDIrecordEdit=test/e2e/specs/all-features-confirmation/recordedit/edit-delete.config.ts
# not part of the make recordedit command anymore
E2EDIrecordMultiFormInput=test/e2e/specs/default-config/multi-form-input/multi-form-input.config.ts
E2EDrecordEditCompositeKey=test/e2e/specs/default-config/recordedit/composite-key.config.ts
E2EDrecordEditDomainFilter=test/e2e/specs/default-config/recordedit/domain-filter.config.ts
E2ErecordEditForeignKeyDropdown=test/e2e/specs/default-config/recordedit/foreign-key-dropdown.config.ts
E2ErecordEditInputIframe=test/e2e/specs/all-features/recordedit/input-iframe.config.ts
E2ErecordEditASCIIValidation=test/e2e/specs/all-features/recordedit/ascii-text-validation.config.ts
# Record tests
E2EDrecord=test/e2e/specs/all-features-confirmation/record/presentation-btn.config.ts
E2EDrecordCopy=test/e2e/specs/all-features/record/copy-btn.config.ts
E2ErecordNoDeleteBtn=test/e2e/specs/delete-prohibited/record/no-delete-btn.config.ts
E2EDrecordRelatedTable=test/e2e/specs/all-features/record/related-table.config.ts
E2EDrecordLinks=test/e2e/specs/default-config/record/links.config.ts
# Recordset tests
E2EDrecordset=test/e2e/specs/all-features-confirmation/recordset/presentation.config.ts
E2EDrecordsetEdit=test/e2e/specs/default-config/recordset/edit.config.ts
E2ErecordsetAdd=test/e2e/specs/default-config/recordset/add.config.ts
E2EDrecordsetIndFacet=test/e2e/specs/delete-prohibited/recordset/facet.config.ts
E2EDrecordsetHistFacet=test/e2e/specs/delete-prohibited/recordset/histogram-facet.config.ts
E2EDrecordsetFacetWithinFacet=test/e2e/specs/default-config/recordset/facet-within-facet.config.ts
E2ErecordsetSavedQuery=test/e2e/specs/all-features/recordset/saved-query.config.ts

# misc tests
E2Enavbar=test/e2e/specs/all-features/navbar/playwright.config.ts
E2EnavbarHeadTitle=test/e2e/specs/all-features-confirmation/navbar/playwright.config.ts
E2EnavbarCatalogConfig=test/e2e/specs/delete-prohibited/navbar/playwright.config.ts
E2EmultiPermissionsVisibility=test/e2e/specs/all-features/permissions.config.ts
# footer test
E2Efooter=test/e2e/specs/all-features-confirmation/footer/playwright.config.ts
# errors test
E2Eerrors=test/e2e/specs/all-features-confirmation/errors/errors.config.ts
## Parallel test scripts
AllFeaturesParallel=test/e2e/specs/all-features/playwright.config.ts
AllFeaturesConfirmationParallel=test/e2e/specs/all-features-confirmation/playwright.config.ts
DeleteProhibitedParallel=test/e2e/specs/delete-prohibited/playwright.config.ts
DefaultConfigParallel=test/e2e/specs/default-config/playwright.config.ts
# Setup for manual tests
Manualrecordset=test/manual/specs/recordset.config.ts

# playwright tests
NAVBAR_TESTS=$(E2Enavbar) $(E2EnavbarHeadTitle) $(E2EnavbarCatalogConfig)
RECORD_TESTS=$(E2EDrecord) $(E2ErecordNoDeleteBtn) $(E2EDrecordRelatedTable) $(E2EDrecordCopy) $(E2EDrecordLinks)
RECORDSET_TESTS=$(E2EDrecordset) $(E2ErecordsetAdd) $(E2EDrecordsetEdit) $(E2ErecordsetSavedQuery) $(E2EDrecordsetIndFacet) $(E2EDrecordsetHistFacet) $(E2EDrecordsetFacetWithinFacet)
RECORDADD_TESTS=$(E2EDIrecordAdd) $(E2EDIrecordImmutable) $(E2EDIrecordMultiFormInput) $(E2ErecordEditForeignKeyDropdown) $(E2EDrecordEditCompositeKey)
RECORDEDIT_TESTS=$(E2EDIrecordEdit) $(E2EDrecordEditNullValues) $(E2ErecordEditInputIframe) $(E2EDrecordEditDomainFilter) $(E2ErecordEditASCIIValidation)
PERMISSIONS_TESTS=$(E2EmultiPermissionsVisibility)
FOOTER_TESTS=$(E2Efooter)
ERRORS_TESTS=$(E2Eerrors)
DEFAULT_CONFIG_PARALLEL_TESTS=$(DefaultConfigParallel)
DELETE_PROHIBITED_PARALLEL_TESTS=$(DeleteProhibitedParallel)
ALL_FEATURES_CONFIRMATION_PARALLEL_TESTS=$(AllFeaturesConfirmationParallel)
ALL_FEATURES_PARALLEL_TESTS=$(AllFeaturesParallel)
PARALLEL_TESTS=$(AllFeaturesConfirmationParallel) $(DefaultConfigParallel) $(AllFeaturesParallel) $(DeleteProhibitedParallel)
ALL_TESTS=$(NAVBAR_TESTS) $(RECORD_TESTS) $(RECORDSET_TESTS) $(RECORDADD_TESTS) $(RECORDEDIT_TESTS) $(PERMISSIONS_TESTS) $(FOOTER_TESTS) $(ERRORS_TESTS)

ALL_MANUAL_TESTS=$(Manualrecordset)

# first argument is the config file location, and second argument will be passed to playwright
define make_test
	rc=0; \
	for file in $(1); do \
		 npx playwright test --project=chromium $(2) --config $$file || rc=1; \
	done; \
	exit $$rc;
endef

test-%:
	$(call make_test, $($*))

#### Sequential make commands - these commands will run tests in sequential order
#Rule to run navbar tests
.PHONY: testnavbar
testnavbar: test-NAVBAR_TESTS

#Rule to run record tests
.PHONY: testrecord
testrecord: test-RECORD_TESTS

#Rule to run record add app tests
.PHONY: testrecordadd
testrecordadd: test-RECORDADD_TESTS

# Rule to run record edit app tests
.PHONY: testrecordedit
testrecordedit: test-RECORDEDIT_TESTS

# Rule to run permission tests
.PHONY: testpermissions
testpermissions:test-PERMISSIONS_TESTS

#Rule to run recordset app tests
.PHONY: testrecordset
testrecordset: test-RECORDSET_TESTS

#Rule to run the default chaise configuration tests in parallel
.PHONY: testfooter
testfooter: test-FOOTER_TESTS

#Rule to run the default chaise configuration tests in parallel
.PHONY: testerrors
testerrors: test-ERRORS_TESTS

#### Parallel make commands - these commands will run tests in parallel
#Rule to run all parallel test configurations
.PHONY: testparallel
testparallel: test-PARALLEL_TESTS

#Rule to run the All features chaise configuration tests in parallel
.PHONY: testallfeatures
testallfeatures: test-ALL_FEATURES_PARALLEL_TESTS

#Rule to run the All features chaise configuration tests in parallel
.PHONY: testallfeaturesconfirmation
testallfeaturesconfirmation: test-ALL_FEATURES_CONFIRMATION_PARALLEL_TESTS

#Rule to run the delete prohibited chaise configuration tests in parallel
.PHONY: testdeleteprohibited
testdeleteprohibited: test-DELETE_PROHIBITED_PARALLEL_TESTS

#Rule to run the default chaise configuration tests in parallel
.PHONY: testdefaultconfig
testdefaultconfig: test-DEFAULT_CONFIG_PARALLEL_TESTS

# Rule to setup schema and data for manual tests
.PHONY: testmanually
testmanually:
	$(call make_test, $(ALL_MANUAL_TESTS), --debug)

# Rule to run tests
.PHONY: test
test: test-ALL_TESTS

# ============================================================= #
#						BULDING THE PACKAGE						#
# ============================================================= #

# source code folder
SOURCE=src

# the build folder
DIST=dist

# where config files are defined
CONFIG=config

# react bundle location
REACT_BUNDLES_FOLDERNAME=bundles
REACT_BUNDLES=$(DIST)/react/$(REACT_BUNDLES_FOLDERNAME)

# build version will change everytime it's called.
$(BUILD_VERSION):

JS_CONFIG=$(CONFIG)/chaise-config.js
$(JS_CONFIG): $(CONFIG)/chaise-config-sample.js
	@cp -n $(CONFIG)/chaise-config-sample.js $(JS_CONFIG) || true
	@touch $(JS_CONFIG)

VIEWER_CONFIG=$(CONFIG)/viewer-config.js
$(VIEWER_CONFIG): $(CONFIG)/viewer-config-sample.js
	@cp -n $(CONFIG)/viewer-config-sample.js $(VIEWER_CONFIG) || true
	@touch $(VIEWER_CONFIG)

# list of file and folders outside of src that will be deployed
RSYNC_FILE_LIST=help-docs \
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

# -------------------------- commands -------------------------- #

# install packages (honors NOD_ENV)
# using clean-install instead of install to ensure usage of pacakge-lock.json
.PHONY: npm-install-modules
npm-install-modules:
	@npm clean-install --loglevel=error

# install packages needed for production and development (including testing)
# --include=dev makes sure to ignore NODE_ENV and install everything
# --no-shell: https://github.com/microsoft/playwright/issues/33566
.PHONY: npm-install-all-modules
npm-install-all-modules:
	@npm clean-install --include=dev
	@npx playwright install --with-deps --no-shell

# for test cases we have to make sure we're installing dev dependencies and playwright is installed
.PHONY: deps-test
deps-test: npm-install-all-modules

# install all the dependencies
.PHONY: deps
deps: npm-install-modules

.PHONY: updeps
updeps:
	npm update

# Rule to clean project directory
.PHONY: clean
clean:
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

.PHONY: lint-tests
lint-tests:
	npx eslint test/e2e --ext .ts,.tsx --quiet

# Rule to create the package.
.PHONY: dist-wo-deps
dist-wo-deps: print-variables run-webpack gitversion

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
#  - send common files/folders
#  - send React related files except bundles folder (this is separated because we're copying to a different relative path)
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
	@echo "  deps-test                      local install of dev node dependencies and install playwright browsers"
	@echo "  root-install                   should only be used as root. will use dist with proper user and then deploy, for GNU systems"
	@echo "  root-install-alt               should only be used as root. will use dist with proper user and then deploy, for FreeBSD and MAC OS X"
	@echo "  lint                           run eslint for the source folder"
	@echo "  lint-w-warn                    run eslint for the source folder and print warnings as well"
	@echo "  lint-tests                     run eslint for the test folder"
	@echo "  test                           run e2e tests"
	@echo "  testrecordadd                  run data entry app add e2e tests"
	@echo "  testrecordedit                 run data entry app edit e2e tests"
	@echo "  testrecord                     run record app e2e tests"
	@echo "  testrecordset                  run recordset app e2e tests"
	@echo "  testviewer                     run viewer app e2e tests"
	@echo "  testnavbar                     run navbar e2e tests"
