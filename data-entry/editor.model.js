// A value to hold the columns from the designated table
(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .value('editorModel', {
        // schema table // a reference to the table do not alter
        // original data // optional: the response from ermrest... useful in the Edit case where you need to know what the Previous values were...
        // edits per row // what you're going to send to ermrest
        // additional vm per row // optional: use this to store state data for each row
        // domainValues (per column): [id, display]
        table: {},
        rows: [  //each row of fields in the form, not the table from ERMrest
            // {
            //     "image_id":11,
            //     "author":"isi",
            //     "timestamp":"2015-12-21T17:43:30.609-08:00",
            //     "anatomy":null,
            //     "context_uri":"https://dev.rebuildingakidney.org/~jessie/openseadragon-viewer/mview.html?url=https://dev.rebuildingakidney.org/data/8fed0117fc94d16590a46d58bf66c9b43c04ea0135d9c0eea3c1a52f2c9e4c12/Brigh/ImageProperties.xml&x=0.5&y=0.25750542661546166&z=0.5473114658864339",
            //     "coords":[-0.0566818558782389,0.0384655409052141,0.10898569923144,0.0769310818104284]
            // },
            // {
            //     "image_id":11,
            //     "author":"isi",
            //     "timestamp":"2015-12-21T17:43:30.609-08:00",
            //     "anatomy":null,
            //     "context_uri":"https://dev.rebuildingakidney.org/~jessie/openseadragon-viewer/mview.html?url=https://dev.rebuildingakidney.org/data/8fed0117fc94d16590a46d58bf66c9b43c04ea0135d9c0eea3c1a52f2c9e4c12/Brigh/ImageProperties.xml&x=0.5&y=0.25750542661546166&z=0.5473114658864339",
            //     "coords":[-0.0566818558782389,0.0384655409052141,0.10898569923144,0.0769310818104284]
            // }
        ],
        domainValues: { //<option value="{{id}}">{{display}}</option>
            // experiment_id: [
            //     {id: 1, display: 'Bill Dempsey'},
            //     {id: 2, display: 'Joe Schmo'},
            //     {id: 3, display: 'Jane Frane'}
            // ],
            // protocol_id: [
            //     {id: 1, display: 'Potato'}
            // ]
        },
        columns: {
            // columnName: {
            //     value: null,
            //     tooltip: ''
            // },
            // columnName: {
            //     value: null,
            //     tooltip: ''
            // }
        }
        // foreignKeys: [],
        // keys: [],
        // nativeColumns: []
    });
})();
