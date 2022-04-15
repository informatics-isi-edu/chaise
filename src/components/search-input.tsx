import { useRef, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { LogActions } from '@chaise/models/log';
import DisplayValue from '@chaise/components/display-value';
import $log from '@chaise/services/logger';
import { ClearInputBtn } from '@chaise/components/clear-input-btn';

type SearchInputProps = {
  searchCallback: Function,
  searchColumns: any,
  initialSearchTerm: string,
  inputClass?: string,
  focus?: boolean,
  disabled?: boolean
}

const SearchInput = ({
  initialSearchTerm,
  searchCallback,
  inputClass,
  searchColumns,
  focus,
  disabled
}: SearchInputProps): JSX.Element => {

  const inputEl = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [inputChangedTimeout, setInputChangedTimeout] = useState<any>(null);
  const AUTO_SEARCH_TIMEOUT = 2000;

  $log.debug('search-input: render');

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
}

  const triggerSearch = (isButton: boolean) => {
    if (disabled) return;

    $log.debug(`search term: ${searchTerm}`);

    // cancel the timeout
    if (inputChangedTimeout) {
      clearTimeout(inputChangedTimeout);
      setInputChangedTimeout(null);
    }

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

    const value = event.target.value;
    setSearchTerm(value);

    // Cancel previous promise for background search that was queued to be called
    if (inputChangedTimeout) {
      clearTimeout(inputChangedTimeout);
    }

    setInputChangedTimeout(setTimeout(
      () => {
        setInputChangedTimeout(null);
        searchCallback(value, LogActions.SEARCH_BOX_AUTO);
      },
      AUTO_SEARCH_TIMEOUT
    ));
  };

  const renderPlaceHolder = () => {
    let inner: string | JSX.Element[] = `Search ${(searchColumns === false ? ' all columns' : '')}`;
    if (Array.isArray(searchColumns)) {
      inner = searchColumns.map((col, i, arr) => {
        return (
          <span key={i}>
            <DisplayValue value={col.displayname} />
            {i < arr.length-1 && <span>, </span>}
          </span>
        )
      })
    }

    return (
      <span
        className='chaise-input-placeholder'
        onClick={() => changeFocus()}
      >
        <span style={{ marginRight: '3px' }}>Search</span>
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
            <span className='chaise-btn-icon fa-solid fa-search' />
          </button>
        </OverlayTrigger>
      </div>
    </div>
  );
}

export default SearchInput;
