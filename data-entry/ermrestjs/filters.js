/******************************************************/
/* Filters                                            */
/******************************************************/

function Negation(filter) {
    this.filter = filter;
}

function Conjunction(filters) {
    this.filters = filters;
}

function Disjunction(filters) {
    this.filters = filters;
}

function UnaryPredicate(column, operator) {
    this.column = column; // pathcolumn or column
    this.operator = operator;
}

function BinaryPredicate(column, operator, rvalue) {

    this.column = column; // either pathcolumn or column
    this.operator = operator;
    this.rvalue = rvalue;
}
