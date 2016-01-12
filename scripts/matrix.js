'use strict';

var isModalOpen = false; //indicates whether modal is open or not. used for arrow key handler.

$(function () {
    var modal = $("#dataset-modal");

    // changing background of column on hover:
    var allCells = $(".experiment-table .matrix-view td");
    allCells
        .on("mouseover", function () {
            var el = $(this),
                pos = el.index();
            el.parent().find("td").addClass("hover");

            allCells.filter(":nth-child(" + (pos + 1) + ")").addClass("hover");
        })
        .on("mouseout", function () {
            allCells.removeClass("hover");
        });

    modal.on('show.bs.modal', function () {
        $(this).focus();
        $(this).show();
        setModalMaxHeight(this);
        isModalOpen = true;
    });

    modal.on('hidden.bs.modal', function (e) {
        isModalOpen = false;
    });


    // used for changing height of modal:
    var modal_in = $('.modal.in');

    $(window).resize(function () {
        if (modal_in.length != 0) {
            setModalMaxHeight(modal_in);
        }
    });

    /**
     * handler for arrow keys. used for navigation in modal view.
     */
    $(document).keyup(function (e) {
        if (isModalOpen) {
            var temp;
            if (e.which == 37) { //left arrow
                temp = $("#prev-col");
            } else if (e.which == 38) { //up arrow
                temp = $("#prev-row");
            } else if (e.which == 39) { //right arrow
                temp = $("#next-col");
            } else if (e.which == 40) { //down arrow
                temp = $("#next-row");
            } else if(e.which == 27){
                modal.modal('hide');
                return false;
            }
            if(temp.length) temp.click();
            return false;
        }
    })

});

/**
 * Changes the height of modal and making it scrollable if needed.
 * @param element : modal element
 */
function setModalMaxHeight(element) {
    var el = $(element);
    var dialogMargin = $(window).width() > 767 ? 62 : 22;
    var contentHeight = $(window).height() - dialogMargin;
    var headerHeight = el.find('.modal-header').outerHeight() || 2;
    var footerHeight = el.find('.modal-footer').outerHeight() || 2;
    var maxHeight = contentHeight - (headerHeight + footerHeight);

    el.find('.modal-content').css({
        'overflow': 'hidden'
    });

    el.find('.modal-body').css({
        'max-height': maxHeight,
        'overflow-y': 'auto'
    });
}
