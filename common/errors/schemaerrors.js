/**
 * Created by jenniferchen on 5/3/16.
 */

var Errors = (function(module) {

    module.SchemaNotFoundError = SchemaNotFoundError;

    module.TableNotFoundError = TableNotFoundError;

    module.ColumnNotFoundError = ColumnNotFoundError;

    module.AnnotationNotFoundError = AnnotationNotFoundError;

    module.KeyNotFoundError = KeyNotFoundError;

    module.MappingNotFoundError = MappingNotFoundError;

    module.ForbiddenError = ForeignKeyNotFoundError;



    function SchemaNotFoundError(message) {
        this.message = message;
    }

    SchemaNotFoundError.prototype = Object.create(Error.prototype);

    SchemaNotFoundError.prototype.constructor = SchemaNotFoundError;



    function TableNotFoundError(message) {
        this.message = message;
    }

    TableNotFoundError.prototype = Object.create(Error.prototype);

    TableNotFoundError.prototype.constructor = TableNotFoundError;



    function ColumnNotFoundError(message) {
        this.message = message;
    }

    ColumnNotFoundError.prototype = Object.create(Error.prototype);

    ColumnNotFoundError.prototype.constructor = ColumnNotFoundError;



    function AnnotationNotFoundError(message) {
        this.message = message;
    }

    AnnotationNotFoundError.prototype = Object.create(Error.prototype);

    AnnotationNotFoundError.prototype.constructor = AnnotationNotFoundError;



    function KeyNotFoundError(message) {
        this.message = message;
    }

    KeyNotFoundError.prototype = Object.create(Error.prototype);

    KeyNotFoundError.prototype.constructor = KeyNotFoundError;



    function MappingNotFoundError(message) {
        this.message = message;
    }

    MappingNotFoundError.prototype = Object.create(Error.prototype);

    MappingNotFoundError.prototype.constructor = MappingNotFoundError;




    function ForeignKeyNotFoundError(message) {
        this.message = message;
    }

    ForeignKeyNotFoundError.prototype = Object.create(Error.prototype);

    ForeignKeyNotFoundError.prototype.constructor = ForeignKeyNotFoundError;

    return module;
})(Errors || {});
