import React, { useRef } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { LogActions } from '@chaise/models/log';
import DisplayValue from '@chaise/components/display-value';
import FontAwesome from '../services/fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type SearchInputProps = {
  searchCallback: Function,
  searchColumns: any,
  searchTerm?: string,
  inputClass?: string,
  focus?: boolean,
  disabled?: boolean
}

const SearchInput = ({
  searchTerm,
  searchCallback,
  inputClass,
  searchColumns,
  focus,
  disabled
}: SearchInputProps): JSX.Element => {

  FontAwesome.addSearchInputFonts();

  const inputEl = useRef<HTMLInputElement>(null);
  const AUTO_SEARCH_TIMEOUT = 2000;
  let inputChangedTimeout : any;

  const changeFocus = () => {
    if (disabled) return;
    inputEl?.current?.focus();
  };

  const triggerSearch = (isButton: boolean) => {
    if (disabled) return;

    // cancel the timeout
    if (inputChangedTimeout) {
      clearTimeout(inputChangedTimeout);
    }

    // remove it from scope
    inputChangedTimeout = null;

    searchCallback(searchTerm, isButton ? LogActions.SEARCH_BOX_CLICK : LogActions.SEARCH_BOX_ENTER);
  }

  const handleEnterPress = (event: any) => {
    if (disabled) return;

    if (event.key === 'Enter') {
      triggerSearch(false);
    }
  };

  const handleInputChange = (event: any) => {
    if (disabled) return;



    // Cancel previous promise for background search that was queued to be called
    if (inputChangedTimeout) {
      clearTimeout(inputChangedTimeout);
    }

    inputChangedTimeout = setTimeout(
      () => {
        inputChangedTimeout = null;
        searchCallback(event.target.value, LogActions.SEARCH_BOX_AUTO);
      },
      AUTO_SEARCH_TIMEOUT
    );
  };

  const renderPlaceHolder = () => {
    let inner: string | JSX.Element[] = `Search ${(searchColumns === false ? ' all columns' : '')}`;
    if (Array.isArray(searchColumns)) {
      inner = searchColumns.map((col, i, arr) => {
        return (
          <span key={i}>
            <DisplayValue value={col.displayname} />
            {i === arr.length && <span style={{ marginLeft: '-4px' }}>, </span>}
          </span>
        )
      })
    }

    return (
      <span
        className="chaise-input-placeholder"
        onClick={() => changeFocus()}
      >
        {inner}
      </span>
    );
  }

  return (
    <div className={'chaise-search-box chaise-input-group ' + (disabled ? 'disabled-element' : '')}>
      <div className='chaise-input-control has-feedback'>
        <input
          type='text'
          ref={inputEl}
          defaultValue={searchTerm}
          className={inputClass}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={handleEnterPress}
          autoFocus={focus === true}
        />
        {!inputEl?.current?.value && renderPlaceHolder()}
        {/* <chaise-clear-input btn-className="remove-search-btn" click-callback="::clearSearch()" show="searchTerm && !disabled"></chaise-clear-input> */}
      </div>
      <div className='chaise-input-group-append'>
        <OverlayTrigger
          placement='bottom-start'
          overlay={
            <Tooltip>
              <p>Use space to separate between conjunctive terms, | (no spaces) to separate disjunctive terms and quotations for exact phrases.</p>
              <p>For example, <i><b>usc 1234</b></i> returns all records containing &ldquo;usc&rdquo; and &ldquo;1234&rdquo;.</p>
              <p><i><b>usc|1234</b></i> returns all records containing &ldquo;usc&rdquo; or &ldquo;1234&rdquo;.</p>
              <p><i><b>&ldquo;usc 1234&rdquo;</b></i> returns all records containing &ldquo;usc 1234&rdquo;.</p>
            </Tooltip>
          }
        >
          <button
            className='chaise-search-btn chaise-btn chaise-btn-primary'
            disabled={disabled} onClick={() => triggerSearch(true)} role='button'
          >
            <FontAwesomeIcon className="chaise-btn-icon" icon="search" />
          </button>
        </OverlayTrigger>
      </div>
    </div>
  );
}

export default SearchInput;
