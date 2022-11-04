
// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import { useEffect, useRef, useState } from 'react';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// utils
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

type SearchInputProps = {
  /**
   * Will be called after search is triggered
   */
  searchCallback: (searchTerm: string | null, action: LogActions) => void,
  /**
   * The search columns
   */
  searchColumns: any,
  /**
   * The initial search term
   */
  initialSearchTerm: string,
  /**
   * The custom class that will be attached to the input
   */
  inputClass?: string,
  /**
   * Whether input should be focused
   */
  focus?: boolean,
  /**
   * Whether input should be disabled
   */
  disabled?: boolean,
  /**
   * A ref that can be used from the parent to clear the search
   * This component is going to register this function when it renders
   */
  forceClearSearch?: any
}

/**
 * Creates a search input that allows users to type a search text and calls
 * the given callback.
 */
const SearchInput = ({
  initialSearchTerm,
  searchCallback,
  inputClass,
  searchColumns,
  focus,
  disabled,
  forceClearSearch
}: SearchInputProps): JSX.Element => {

  const inputEl = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showPlaceholderTooltip, setShowPlaceholderTooltip] = useState(false);
  const placeholderEl = useRef<HTMLSpanElement>(null);
  const inputChangedTimeout = useRef<number | null>(null);
  const AUTO_SEARCH_TIMEOUT = 2000;

  useEffect(() => {
    if (forceClearSearch) {
      forceClearSearch.current = clearSearch;
    }
  }, [])

  const changeFocus = () => {
    if (disabled) return;
    inputEl?.current?.focus();
  };

  const clearSearch = () => {
    if (disabled) return;
    if (searchTerm) {
      searchCallback(null, LogActions.SEARCH_BOX_CLEAR);
    }
    setSearchTerm('');
  };

  const triggerSearch = (isButton: boolean) => {
    if (disabled) return;

    // $log.debug(`search term: ${searchTerm}`);

    // cancel the timeout
    if (inputChangedTimeout.current) {
      clearTimeout(inputChangedTimeout.current);
      inputChangedTimeout.current = null;
    }

    searchCallback(searchTerm, isButton ? LogActions.SEARCH_BOX_CLICK : LogActions.SEARCH_BOX_ENTER);
  }

  const handleEnterPress = (event: any) => {
    if (disabled || event.key !== 'Enter') return;

    triggerSearch(false);
  };

  const handleInputChange = (event: any) => {
    if (disabled) return;

    const value = event.target.value;
    setSearchTerm(value);

    // Cancel previous promise for background search that was queued to be called
    if (inputChangedTimeout.current) {
      clearTimeout(inputChangedTimeout.current);
    }

    inputChangedTimeout.current = windowRef.setTimeout(
      () => {
        inputChangedTimeout.current = null;
        searchCallback(value, LogActions.SEARCH_BOX_AUTO);
      },
      AUTO_SEARCH_TIMEOUT
    );
  };

  const renderPlaceHolder = () => {
    let inner: string | JSX.Element[] = `Search ${(searchColumns === false ? ' all columns' : '')}`;

    // create a placeholder in the format of 'Search <col1>, <col2>'
    if (Array.isArray(searchColumns)) {
      inner = [<span key={0}>Search </span>];

      // list all the column displaynames
      inner.push(...searchColumns.map((col, i, arr) => {
        return (
          <span key={i + 1}>
            <DisplayValue value={col.displayname} />
            {i < arr.length - 1 && <span>, </span>}
          </span>
        )
      }));
    }

    return (
      <ChaiseTooltip
        placement='bottom-start'
        tooltip={<>inner</>}
        onToggle={(nextshow: boolean) => {
          if (!placeholderEl.current) return;

          const el = placeholderEl.current;
          const overflow = el && el.scrollWidth > el.offsetWidth;

          // placeholder should be displayed if we're showing ellipsis
          setShowPlaceholderTooltip(nextshow && overflow);
        }}
        show={showPlaceholderTooltip}
      >
        <span
          ref={placeholderEl}
          className='chaise-input-placeholder'
          onClick={() => changeFocus()}
        >
          {inner}
        </span>
      </ChaiseTooltip>
    );
  }
  return (
    <div className={'chaise-search-box chaise-input-group ' + (disabled ? 'disabled-element' : '')}>
      <div className='chaise-input-control has-feedback'>
        <input
          type='text'
          ref={inputEl}
          value={searchTerm ? searchTerm : ''}
          className={inputClass}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={handleEnterPress}
          autoFocus={focus === true}
        />
        {!searchTerm && renderPlaceHolder()}
        <ClearInputBtn
          btnClassName='remove-search-btn'
          clickCallback={clearSearch}
          show={searchTerm && !disabled ? true : false}
        />
      </div>
      <div className='chaise-input-group-append'>
        <ChaiseTooltip
          placement='bottom-start'
          tooltip={
            <>
              <p>Use space to separate between conjunctive terms, | (no spaces) to separate disjunctive terms and quotations for exact phrases.</p>
              <p>For example, <i><b>usc 1234</b></i> returns all records containing &ldquo;usc&rdquo; and &ldquo;1234&rdquo;.</p>
              <p><i><b>usc|1234</b></i> returns all records containing &ldquo;usc&rdquo; or &ldquo;1234&rdquo;.</p>
              <p><i><b>&ldquo;usc 1234&rdquo;</b></i> returns all records containing &ldquo;usc 1234&rdquo;.</p>
            </>
          }
        >
          <button
            className='chaise-search-btn chaise-btn chaise-btn-primary'
            disabled={disabled} onClick={() => triggerSearch(true)} role='button'
          >
            <span className='chaise-btn-icon fa-solid fa-magnifying-glass' />
          </button>
        </ChaiseTooltip>
      </div>
    </div>
  );
}

export default SearchInput;
