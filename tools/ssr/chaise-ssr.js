/*
======= jquery script =======
This is a colection of jQuery functions to make available alongside the pregenerated static html pages for record app
This is intended to work with the pages defined in generate-scripts/ssr-test.js

ssr-test.js is a script to get 1 of each page from the following schema:table for gudmap
   schema:tables include:
    - Gene_Expression:Specimen
    - Common:Gene
    - Common:Collection
    - Protocol:Protocol
    - RNASeq:Study
after running that script, include `<script src="/~jchudy/chaise-ssr.js"></script>` at the bottom of the <body> tag before the <no-script> tag
*/

// share shows on page load until toggled
$(".chaise-share-citation")[0].style.display = "none";
$(".modal-backdrop")[0].style.display = "none";

$(".page-size-dropdown").each(function (idx, el) {
    $(el).find(".caret").remove();
    $(el).replaceWith($('<span>' + el.innerHTML + '</span>'));
});

/* ==== Specimen Record Page ==== */
// remove sort icon for "Representative Schematic" column
$("#rt-Anatomical-Source .c_4i46PPXHS0zOAhJymPNNaw").removeClass("clickable");
$("#rt-Anatomical-Source .c_4i46PPXHS0zOAhJymPNNaw .not-sorted-icon").remove();
// remove sort icon for "Thumbnail" column
$("#rt-Image .c_Thumbnail_URL").removeClass("clickable");
$("#rt-Image .c_Thumbnail_URL .not-sorted-icon").remove();
// remove sort icon for "Source Image" column
$("#rt-Segmented-3D-Image .c_h5rbr87o4gEW77HEUpW0pw").removeClass("clickable");
$("#rt-Segmented-3D-Image .c_h5rbr87o4gEW77HEUpW0pw .not-sorted-icon").remove();
// remove sort icon for "Imaging Data" column
$("#rt-Derived-Specimen .c_kX95FYSJ1GTOIXdvVWOwng").removeClass("clickable");
$("#rt-Derived-Specimen .c_kX95FYSJ1GTOIXdvVWOwng .not-sorted-icon").remove();

/* ==== Gene Record Page ==== */
// remove sort icon for "Reference Image" column
$("#rt-Single-Cell-Visualization .c_8HFVaLlTUqBDa0dfgwS2oQ").removeClass("clickable");
$("#rt-Single-Cell-Visualization .c_8HFVaLlTUqBDa0dfgwS2oQ .not-sorted-icon").remove();

/* ==== Protocol Record Page ==== */
// remove sort icon for "Thumbnail" column
$("#rt-Attachments .c_File_Name").removeClass("clickable");
$("#rt-Attachments .c_File_Name .not-sorted-icon").remove();

var prevBtns = $(".chaise-table-previous-btn");
$(".chaise-table-next-btn").each(function (idx, el) {
    if (el.disabled) {
        prevBtns[idx].style.display = "none";
        el.style.display = "none";
    }
});

$(".chaise-table-next-btn").on("click", function ($event) {
    var target = $event.target,
        displayNameEl = null;

    tableContainer = target.closest(".related-table-accordion");
    if (tableContainer) {
        displayNameEl = $(tableContainer).find(".rt-displayname");
    }

    var reload = confirm("Click ok and we will reload the page to restore functionality to try again.");

    if (reload) window.location.href = document.querySelectorAll('[rel="canonical"]')[0].href + "?scrollTo=" + displayNameEl.text();
});

/* ==== ON CLICK FUNCTIONS ==== */

// click event to open share dialog visibility
var shareHidden = true;
$("#share").on("click", function () {
    if (shareHidden) {
        $(".chaise-share-citation")[0].style.display = "block";
        $(".modal-backdrop")[0].style.display = "block";
    }

    shareHidden = false;
});

$(".chaise-share-citation .modal-close").on("click", function () {
    if (!shareHidden) {
        $(".chaise-share-citation")[0].style.display = "none";
        $(".modal-backdrop")[0].style.display = "none";
    }

    shareHidden = true;
});

// click event to SHOW the ToC
$(".hide-toc-btn").on("click", function () {
    // buttons
    $(".hide-toc-btn").addClass("ng-hide");
    $(".show-toc-btn").removeClass("ng-hide");
    // top left
    $(".top-left-panel").removeClass("open-panel");
    $(".top-left-panel").addClass("close-panel");
    // bottom left
    $("#record-side-pan").removeClass("open-panel");
    $("#record-side-pan").addClass("close-panel");
});

// click event to HIDE the ToC
$(".show-toc-btn").on("click", function () {
    // buttons
    $(".show-toc-btn").addClass("ng-hide");
    $(".hide-toc-btn").removeClass("ng-hide");
    // top left
    $(".top-left-panel").removeClass("close-panel");
    $(".top-left-panel").addClass("open-panel");
    // bottom left
    $("#record-side-pan").removeClass("close-panel");
    $("#record-side-pan").addClass("open-panel");
});

// click event to toggle navbar options (and children)
$("#navbar-menu > li > a, ul > li.dropdown-submenu > a").on("click", function ($event) {
    function getNextSibling(elem, selector) {
        var sibling = elem.nextElementSibling;
        if (!selector) return sibling;
        while (sibling) {
            if (sibling.matches(selector)) return sibling;
            sibling = sibling.nextElementSibling
        }
    };
    // ele - dropdown ul element
    function checkHeight(ele, winHeight) {
        // no dropdown is open
        if (!ele) return;

        var dropdownHeight = ele.offsetHeight;
        var fromTop = ele.offsetTop;
        var footerBuffer = 50;

        if ((dropdownHeight + fromTop) > winHeight) {
            var newHeight = winHeight - fromTop - footerBuffer;
            ele.style.height = newHeight + "px";
        }
    };

    /* Function to calculate the left of the toggleSubMenu*/
    function getOffsetValue(element){
        var offsetLeft = 0
        while(element) {
            offsetLeft += element.offsetLeft;
            element = element.offsetParent;
        }
        return offsetLeft;
    };
    // target should be <a>
    var target = $event.target;
    // added markdownName support allows for inline template to be defined like :span:TEXT:/span:{.class-name}
    if (target.localName != "a") {
        target = target.parentElement;
        // one more level deep just in case there's a glyphicon in the span
        if (target.localName != "a") {
            target = target.parentElement;
        }
    }

    var menuTarget = getNextSibling(target, ".dropdown-menu"); // dropdown submenu <ul>
    var immediateParent = target.offsetParent; // parent, <li>
    var parent = immediateParent.offsetParent; // parent's parent, dropdown menu <ul>
    var posValues = getOffsetValue(immediateParent);

    // calculate the position the submenu should open from the top fo the viewport
    if (parent.scrollTop == 0){
        menuTarget.style.top = parseInt(immediateParent.offsetTop + parent.offsetTop) + 10 + 'px';
    } else if (parent.scrollTop > 0) {
        menuTarget.style.top = parseInt((immediateParent.offsetTop + parent.offsetTop) - parent.scrollTop) + 10 + 'px';
    }

    if (immediateParent.classList.contains("dropdown-submenu")) menuTarget.style.left = parseInt(posValues + immediateParent.offsetWidth) + 5 + 'px';

    var open = !menuTarget.classList.contains("show");

    // if we're opening this, close all the other dropdowns on navbar.
    if (open) {
        document.querySelectorAll('.dropdown-menu.show').forEach(function(el) {
            // NOTE: fragile
            var grandparent = parent.parentNode.parentNode;
            if (el != menuTarget && el != parent && el != grandparent) {
                el.parentElement.classList.remove("child-opened");
                el.classList.remove("show");
            }
        });
    }

    menuTarget.classList.toggle("show"); // toggle the class
    menuTarget.style.height = "unset"; // remove height in case it was set for a different position
    immediateParent.classList.toggle("child-opened"); // used for setting highlight color

    if (open) {
        // recalculate the height for each open submenu, <ul>
        var openSubmenus = document.querySelectorAll(".dropdown-menu.show");
        [].forEach.call(openSubmenus, function(el) {
            checkHeight(el, window.innerHeight);
        });
    }
});

// click event for RID search button
$(".chaise-search-btn").on("click", function () {
    var searchVal = $("#rid-search-input")[0].value.trim();

    window.location.href = "https://www.gudmap.org/id/" + searchVal;
});

// click event for "Explore" button
$(".more-results-link").on("click", function ($event) {
    var target = $event.target;
    if (target.localName != "button") {
        target = target.parentElement;
    }

    var url = document.createElement('a');
    url.href = target.attributes.getNamedItem("appLink").value;

    window.location.replace(url);
});

// tables show by default
var tableHidden = false;
// click event to toggle the visibility of related tables
$("#show-all-related-tables").on("click", function ($event) {
    var sections = $(".empty-rt");
    for (var i=0; i<sections.length; i++) {
        var section = sections[i];
        if (!tableHidden) {
            // hide content
            section.style.display = "none";
        } else {
            // show content
            section.style.display = section.localName == "tr" ? "table-row" : "block";
        }
    }

    var text = (!tableHidden ? "Show" : "Hide") + " empty sections";

    $("#show-all-related-tables").find(".ng-binding")[0].innerText = text;

    tableHidden = !tableHidden;
});

// click event to scroll to section associated with clicked ToC heading
$(".toc-heading").on("click", function ($event) {
    var target = $event.target,
        main = $(".main-container");

    // make sure we are working with an anchor tag
    if (target.localName != "a") target = $(target).find("a").length > 0 ? $(target).find("a") : target.parentElement;
    // check for summary being clicked, scroll top instead
    if (target.innerText == "Summary") return main.scrollTo(0, 0, 500);
    // get displayname.value from the target's child with class ng-scope
    var idVal = $(target).find(".ng-scope")[0].innerText;
    // make the value html safe before search for the id
    var ID_SAFE_REGEX = /[^\w-]+/g;
    var htmlId = String(idVal).replace(ID_SAFE_REGEX, '-');
    // "entity-" is used for record entity section
    var el = $("#entity-" + htmlId);
    if (el[0]) {
        // if in entity section, grab parent
        el = el.parent();
    } else {
        // "rt-heading-" is used for related table section
        el = $("#rt-heading-" + htmlId);
    }
    // scroll the main container to the clicked toc options corresponding related table
    main.animate({
        scrollTop: el.offset().top - main.offset().top + main.scrollTop()
    }, 40);
});

// click event to toggle related table accordion sections open/closed
$(".related-table-accordion .panel-heading").on("click", function ($event) {
    var target = $event.target;
    if (!target.className.includes("related-table-accordion")) target = target.closest(".related-table-accordion");

    var isOpen;
    // toggle panel open/closed
    if (target.className.includes("panel-open")) {
        isOpen = true;
        $(target).find(".panel-collapse").removeClass("in");
        $(target).removeClass("panel-open");
    } else {
        isOpen = false;
        $(target).find(".panel-collapse").addClass("in");
        $(target).addClass("panel-open");
    }

    var chevronElement = $(target).find(".toggle-icon.fas");
    // flip the chevron icon
    if (isOpen) {
        chevronElement.removeClass("fa-chevron-down");
        chevronElement.addClass("fa-chevron-right");
    } else {
        chevronElement.removeClass("fa-chevron-right");
        chevronElement.addClass("fa-chevron-down");
    }
});

// record display toggle buttons
// NOTE: should default to table display mode initially (entity-markdown)
$("td.entity-value .toggle-display-link").on("click", function ($event) {
    var target = $event.target;
    if (!target.className.includes("toggle-display-link")) target = target.closest(".toggle-display-link");

    var mkdnEl = $(target.closest(".entity-value")).find(".entity-markdown"),
        tableEl = $(target.closest(".entity-value")).find(".entity-rectab");

    if (tableEl[0].className.includes("ng-hide")) {
        // show the table
        mkdnEl.removeClass("ng-show");
        mkdnEl.addClass("ng-hide");

        tableEl.removeClass("ng-hide");
        tableEl.addClass("ng-show");
    } else {
        //show the markdown display
        mkdnEl.removeClass("ng-hide");
        mkdnEl.addClass("ng-show");

        tableEl.removeClass("ng-show");
        tableEl.addClass("ng-hide");
    }
});

// related table toggle buttons
$(".related-table-accordion .toggle-display-link").on("click", function ($event) {
    $event.stopPropagation();
    var target = $event.target;
    if (!target.className.includes("toggle-display-link")) target = target.closest(".toggle-display-link");

    var mkdnEl = $(target.closest(".related-table-accordion")).find(".rt-markdown"),
        tableEl = $(target.closest(".related-table-accordion")).find(".rt-rectab");

    if (tableEl[0].className.includes("ng-hide")) {
        // show the table
        mkdnEl.removeClass("ng-show");
        mkdnEl.addClass("ng-hide");

        tableEl.removeClass("ng-hide");
        tableEl.addClass("ng-show");
    } else {
        //show the markdown display
        mkdnEl.removeClass("ng-hide");
        mkdnEl.addClass("ng-show");

        tableEl.removeClass("ng-show");
        tableEl.addClass("ng-hide");
    }
});

// redirect to chaise with prompt login query param
$("#login-link").on("click", function ($event) {
    window.location.href = document.querySelectorAll('[rel="canonical"]')[0].href + "?promptlogin";
});

// export is hidden on page load
var exportHidden = true;
$("export .dropdown-toggle").on("click", function ($event) {
    var target = $event.target;
    if (!target.className.includes("dropdown-toggle")) target = target.closest(".dropdown-toggle");

    var exportDropdown = $("export .chaise-btn-group.dropdown");

    if (exportHidden) {
        // show the dropdown
        exportDropdown.addClass("open");
    } else {
        // hide the dropdown
        exportDropdown.removeClass("open");
    }

    exportHidden = !exportHidden;
});

// download the default csv option. Does NOT require login
$(".export-This-record-CSV-").on("click", function ($event) {
    window.location.href = $event.target.attributes.getNamedItem("csvLink").value;
});

// redirect to dynamic chaise page and prompt for login
$(".export-BDBag").on("click", function ($event) {
    window.location.href = document.querySelectorAll('[rel="canonical"]')[0].href + "?promptlogin";
});

$("th.clickable").on("click", function ($event) {
    var target = $event.target;
    if (!target.className.includes("clickable")) target = target.closest(".clickable");

    if (target.className.includes("c_4i46PPXHS0zOAhJymPNNaw") || target.className.includes("c_Thumbnail_URL") || target.className.includes("c_h5rbr87o4gEW77HEUpW0pw") || target.className.includes("c_kX95FYSJ1GTOIXdvVWOwng")) {
        return;
    }

    var sortIcon = $(target).find(".column-sort-icon > span").not(".ng-hide");

    var sorted = false;
    var alphaSort = false;
    // determine current sort to define which sort direction to use
    if (sortIcon[0].innerHTML.includes("fa-arrows-alt-v")) {
        sorted = false;
    } else if (sortIcon[0].innerHTML.includes("fa-long-arrow-alt-up")){
        sorted = true;
        alphaSort = true;
    } else {
        sorted = true;
        alphaSort = false;
    }

    var columnClass = "";
    target.classList.forEach(function (headerClass) {
        if (headerClass.indexOf("c_") != -1) {
            columnClass = headerClass;
        }
    });
    var cellClass = columnClass + "_value";

    var table = target.closest("record-table");
    var tableBody = $(table).find("tbody")[0];
    var tableRows = $(tableBody).find("tr");

    tableRows.sort(function (a, b) {
        // the <td> element that contains cellClass
        a = $(a).find("." + cellClass)[0].innerText;
        b = $(b).find("." + cellClass)[0].innerText;

        if (!alphaSort) {
            // if current is not sorted or reverse alpha
            return (b.toUpperCase()) < (a.toUpperCase()) ? 1 : -1;
        } else {
            return (b.toUpperCase()) > (a.toUpperCase()) ? 1 : -1;
        }

    }).appendTo(tableBody);

    // change all icons to not sorted icons
    $(table).find(".column-sort-icon").each(function (idx, el) {
        var visibleIcon = $(el).children("span").not(".ng-hide");
        // does the shown th > span NOT include "not sorted icon" and not the currently clicked <th>
        if (!visibleIcon[0].innerHTML.includes("not-sorted-icon") && visibleIcon.closest("th")[0] != target) {
            // show "not sorted icon" element if it's not current <th> and it's a sort icon
            $(el).children("span.ng-hide").removeClass("ng-hide");
            // hide sort icon (alpha or reverse alpha)
            visibleIcon.addClass("ng-hide");
        }
    });

    var newIcon;
    if (!sorted) {
        $(sortIcon[0]).addClass("ng-hide");
        $($(target).find(".column-sort-icon > span.ng-hide")[0]).removeClass("ng-hide");

        // default is to show reverse alpha icon (fa-long-arrow-alt-down), swap it
        newIcon = $(target).find(".column-sort-icon .fa-long-arrow-alt-down")[0];
        $(newIcon).removeClass("fa-long-arrow-alt-down");
        $(newIcon).addClass("fa-long-arrow-alt-up");
    } else {
        if (alphaSort) {
            // swap to reverse alpha
            newIcon = sortIcon.find(".fa-long-arrow-alt-up");
            $(newIcon).removeClass("fa-long-arrow-alt-up");
            $(newIcon).addClass("fa-long-arrow-alt-down");
        } else {
            // swap to alpha
            newIcon = sortIcon.find(".fa-long-arrow-alt-down");
            $(newIcon).removeClass("fa-long-arrow-alt-down");
            $(newIcon).addClass("fa-long-arrow-alt-up");
        }
    }
});
